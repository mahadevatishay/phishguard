from fastapi import APIRouter, Depends
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import Campaign, Target, User, ClickEvent
from ..auth import get_current_admin
from ..models import Admin
import csv, io
from datetime import datetime

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.get("/summary")
def reports_summary(db: Session = Depends(get_db), current: Admin = Depends(get_current_admin)):
    campaigns = db.query(Campaign).order_by(Campaign.created_at.desc()).all()
    result = []
    for c in campaigns:
        targets = db.query(Target).filter(Target.campaign_id == c.id).all()
        sent = sum(1 for t in targets if t.email_sent)
        clicked = sum(1 for t in targets if t.link_clicked)
        reported = sum(1 for t in targets if t.reported)
        submitted = sum(1 for t in targets if t.credentials_submitted)
        trained = sum(1 for t in targets if t.training_completed)
        result.append({
            "id": c.id, "name": c.name, "status": c.status,
            "launch_date": c.launch_date.isoformat() if c.launch_date else None,
            "end_date": c.end_date.isoformat() if c.end_date else None,
            "total_targets": len(targets), "sent": sent, "clicked": clicked,
            "reported": reported, "submitted": submitted, "trained": trained,
            "click_rate": round(clicked/sent*100, 1) if sent > 0 else 0,
            "report_rate": round(reported/sent*100, 1) if sent > 0 else 0,
            "submission_rate": round(submitted/sent*100, 1) if sent > 0 else 0,
        })
    return result

@router.get("/export/csv")
def export_csv(campaign_id: int = None, db: Session = Depends(get_db),
               current: Admin = Depends(get_current_admin)):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Campaign ID", "Campaign Name", "User Email", "User Name",
                     "Department", "Email Sent", "Link Clicked", "Credentials Submitted",
                     "Reported", "Training Completed", "Risk Score", "Clicked At"])
    q = db.query(Target)
    if campaign_id:
        q = q.filter(Target.campaign_id == campaign_id)
    targets = q.all()
    for t in targets:
        user = db.query(User).filter(User.id == t.user_id).first()
        campaign = db.query(Campaign).filter(Campaign.id == t.campaign_id).first()
        writer.writerow([
            t.campaign_id, campaign.name if campaign else "N/A",
            user.email if user else "N/A",
            f"{user.first_name} {user.last_name}" if user else "N/A",
            user.department if user else "N/A",
            t.email_sent, t.link_clicked, t.credentials_submitted,
            t.reported, t.training_completed,
            user.risk_score if user else 0,
            t.clicked_at.isoformat() if t.clicked_at else "N/A"
        ])
    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=phishguard_report.csv"}
    )

@router.get("/export/pdf")
def export_pdf(campaign_id: int = None, db: Session = Depends(get_db),
               current: Admin = Depends(get_current_admin)):
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
        from reportlab.platypus import KeepTogether
        from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4,
                                rightMargin=2*cm, leftMargin=2*cm,
                                topMargin=2*cm, bottomMargin=2*cm)

        # Colors
        DARK = colors.HexColor('#0f172a')
        CYAN = colors.HexColor('#00b8f5')
        GRAY = colors.HexColor('#64748b')
        LIGHT = colors.HexColor('#f1f5f9')
        RED = colors.HexColor('#ef4444')
        GREEN = colors.HexColor('#10b981')
        ORANGE = colors.HexColor('#f97316')
        WHITE = colors.white

        styles = getSampleStyleSheet()

        title_style = ParagraphStyle('Title', fontSize=22, fontName='Helvetica-Bold',
                                     textColor=DARK, spaceAfter=4, alignment=TA_LEFT)
        sub_style = ParagraphStyle('Sub', fontSize=10, fontName='Helvetica',
                                   textColor=GRAY, spaceAfter=2)
        h2_style = ParagraphStyle('H2', fontSize=13, fontName='Helvetica-Bold',
                                  textColor=DARK, spaceBefore=14, spaceAfter=6)
        normal_style = ParagraphStyle('Normal', fontSize=9, fontName='Helvetica',
                                      textColor=DARK, spaceAfter=4)
        small_style = ParagraphStyle('Small', fontSize=8, fontName='Helvetica',
                                     textColor=GRAY)

        story = []
        generated_at = datetime.utcnow().strftime("%B %d, %Y at %H:%M UTC")

        # Header block
        header_data = [[
            Paragraph("🛡 PhishGuard", ParagraphStyle('Logo', fontSize=18,
                      fontName='Helvetica-Bold', textColor=WHITE)),
            Paragraph(f"Security Report<br/><font size=8 color='#94a3b8'>Generated {generated_at}</font>",
                      ParagraphStyle('HR', fontSize=11, fontName='Helvetica-Bold',
                                     textColor=WHITE, alignment=TA_RIGHT))
        ]]
        header_table = Table(header_data, colWidths=[9*cm, 8*cm])
        header_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), DARK),
            ('PADDING', (0,0), (-1,-1), 14),
            ('ROUNDEDCORNERS', [8]),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 0.5*cm))

        # Fetch data
        if campaign_id:
            campaigns = db.query(Campaign).filter(Campaign.id == campaign_id).all()
        else:
            campaigns = db.query(Campaign).order_by(Campaign.created_at.desc()).all()

        # Overall summary
        all_targets = db.query(Target).all()
        if campaign_id:
            all_targets = db.query(Target).filter(Target.campaign_id == campaign_id).all()

        total_sent = sum(1 for t in all_targets if t.email_sent)
        total_clicked = sum(1 for t in all_targets if t.link_clicked)
        total_reported = sum(1 for t in all_targets if t.reported)
        total_submitted = sum(1 for t in all_targets if t.credentials_submitted)
        total_trained = sum(1 for t in all_targets if t.training_completed)

        click_rate = round(total_clicked/total_sent*100, 1) if total_sent > 0 else 0
        report_rate = round(total_reported/total_sent*100, 1) if total_sent > 0 else 0
        submission_rate = round(total_submitted/total_sent*100, 1) if total_sent > 0 else 0

        story.append(Paragraph("Executive Summary", h2_style))
        story.append(HRFlowable(width="100%", thickness=1, color=LIGHT, spaceAfter=8))

        # KPI cards row
        kpi_data = [
            [
                Paragraph(f"<b>{total_sent}</b><br/><font size=8 color='#64748b'>Emails Sent</font>", normal_style),
                Paragraph(f"<b>{total_clicked}</b><br/><font size=8 color='#64748b'>Links Clicked</font>", normal_style),
                Paragraph(f"<b>{click_rate}%</b><br/><font size=8 color='#64748b'>Click Rate</font>", normal_style),
                Paragraph(f"<b>{total_reported}</b><br/><font size=8 color='#64748b'>Reported</font>", normal_style),
                Paragraph(f"<b>{report_rate}%</b><br/><font size=8 color='#64748b'>Report Rate</font>", normal_style),
                Paragraph(f"<b>{total_trained}</b><br/><font size=8 color='#64748b'>Trained</font>", normal_style),
            ]
        ]
        kpi_table = Table(kpi_data, colWidths=[2.8*cm]*6)
        kpi_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), LIGHT),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('PADDING', (0,0), (-1,-1), 10),
            ('ROUNDEDCORNERS', [6]),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ]))
        story.append(kpi_table)
        story.append(Spacer(1, 0.5*cm))

        # Risk level summary
        all_users = db.query(User).filter(User.is_active == True).all()
        high_risk = sum(1 for u in all_users if u.risk_score >= 70)
        med_risk = sum(1 for u in all_users if 40 <= u.risk_score < 70)
        low_risk = sum(1 for u in all_users if 0 < u.risk_score < 40)
        no_risk = sum(1 for u in all_users if u.risk_score == 0)

        story.append(Paragraph("User Risk Distribution", h2_style))
        story.append(HRFlowable(width="100%", thickness=1, color=LIGHT, spaceAfter=8))

        risk_data = [
            ["Risk Level", "Count", "Percentage", "Action Required"],
            ["🔴  High Risk (70-100)", str(high_risk),
             f"{round(high_risk/len(all_users)*100,1) if all_users else 0}%",
             "Immediate training required"],
            ["🟡  Medium Risk (40-69)", str(med_risk),
             f"{round(med_risk/len(all_users)*100,1) if all_users else 0}%",
             "Schedule awareness session"],
            ["🔵  Low Risk (1-39)", str(low_risk),
             f"{round(low_risk/len(all_users)*100,1) if all_users else 0}%",
             "Monitor and reinforce"],
            ["✅  No Risk (0)", str(no_risk),
             f"{round(no_risk/len(all_users)*100,1) if all_users else 0}%",
             "Maintain good habits"],
        ]
        risk_table = Table(risk_data, colWidths=[5*cm, 2*cm, 3*cm, 7*cm])
        risk_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), DARK),
            ('TEXTCOLOR', (0,0), (-1,0), WHITE),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 9),
            ('PADDING', (0,0), (-1,-1), 8),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, LIGHT]),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('ALIGN', (1,0), (2,-1), 'CENTER'),
        ]))
        story.append(risk_table)
        story.append(Spacer(1, 0.5*cm))

        # Per campaign breakdown
        story.append(Paragraph("Campaign Breakdown", h2_style))
        story.append(HRFlowable(width="100%", thickness=1, color=LIGHT, spaceAfter=8))

        camp_data = [["Campaign", "Status", "Targets", "Sent", "Clicked", "Click%", "Reported", "Submitted"]]
        for c in campaigns:
            targets = db.query(Target).filter(Target.campaign_id == c.id).all()
            sent = sum(1 for t in targets if t.email_sent)
            clicked = sum(1 for t in targets if t.link_clicked)
            reported = sum(1 for t in targets if t.reported)
            submitted = sum(1 for t in targets if t.credentials_submitted)
            cr = round(clicked/sent*100, 1) if sent > 0 else 0
            camp_data.append([
                c.name[:28] + "..." if len(c.name) > 28 else c.name,
                c.status.upper(), str(len(targets)), str(sent),
                str(clicked), f"{cr}%", str(reported), str(submitted)
            ])

        camp_table = Table(camp_data, colWidths=[5.5*cm, 1.8*cm, 1.5*cm, 1.5*cm, 1.5*cm, 1.5*cm, 1.8*cm, 1.8*cm])
        camp_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), DARK),
            ('TEXTCOLOR', (0,0), (-1,0), WHITE),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('PADDING', (0,0), (-1,-1), 7),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, LIGHT]),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('ALIGN', (1,0), (-1,-1), 'CENTER'),
        ]))
        story.append(camp_table)
        story.append(Spacer(1, 0.5*cm))

        # Top risky users
        story.append(Paragraph("Top High Risk Users", h2_style))
        story.append(HRFlowable(width="100%", thickness=1, color=LIGHT, spaceAfter=8))

        risky_users = db.query(User).filter(User.risk_score > 0)\
            .order_by(User.risk_score.desc()).limit(10).all()

        user_data = [["Name", "Email", "Department", "Risk Score", "Risk Level"]]
        for u in risky_users:
            level = "🔴 High" if u.risk_score >= 70 else "🟡 Medium" if u.risk_score >= 40 else "🔵 Low"
            user_data.append([
                f"{u.first_name} {u.last_name}",
                u.email, u.department or "—",
                f"{u.risk_score:.1f}", level
            ])

        if len(user_data) > 1:
            user_table = Table(user_data, colWidths=[4*cm, 5.5*cm, 3.5*cm, 2.5*cm, 2*cm])
            user_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), DARK),
                ('TEXTCOLOR', (0,0), (-1,0), WHITE),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('FONTSIZE', (0,0), (-1,-1), 8),
                ('PADDING', (0,0), (-1,-1), 7),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, LIGHT]),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
                ('ALIGN', (3,0), (4,-1), 'CENTER'),
            ]))
            story.append(user_table)
        else:
            story.append(Paragraph("No risk data available yet.", small_style))

        # Footer
        story.append(Spacer(1, 1*cm))
        story.append(HRFlowable(width="100%", thickness=1, color=LIGHT))
        story.append(Spacer(1, 0.2*cm))
        story.append(Paragraph(
            f"PhishGuard Security Awareness Platform  •  Generated {generated_at}  •  For internal use only",
            ParagraphStyle('Footer', fontSize=7, textColor=GRAY, alignment=TA_CENTER)
        ))

        doc.build(story)
        buffer.seek(0)

        filename = f"phishguard_report_campaign_{campaign_id}.pdf" if campaign_id else "phishguard_full_report.pdf"
        return Response(
            content=buffer.read(),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    except Exception as e:
        return Response(content=f"PDF generation failed: {str(e)}", status_code=500)

@router.get("/department-stats")
def department_stats(db: Session = Depends(get_db), current: Admin = Depends(get_current_admin)):
    users = db.query(User).filter(User.is_active == True).all()
    dept_map = {}
    for user in users:
        dept = user.department or "Unknown"
        if dept not in dept_map:
            dept_map[dept] = {
                "department": dept, "total_users": 0, "total_sent": 0,
                "total_clicked": 0, "total_reported": 0, "total_submitted": 0,
                "total_trained": 0, "risk_scores": []
            }
        dept_map[dept]["total_users"] += 1
        dept_map[dept]["risk_scores"].append(user.risk_score)
        targets = db.query(Target).filter(Target.user_id == user.id).all()
        for t in targets:
            if t.email_sent: dept_map[dept]["total_sent"] += 1
            if t.link_clicked: dept_map[dept]["total_clicked"] += 1
            if t.reported: dept_map[dept]["total_reported"] += 1
            if t.credentials_submitted: dept_map[dept]["total_submitted"] += 1
            if t.training_completed: dept_map[dept]["total_trained"] += 1

    result = []
    for dept, d in dept_map.items():
        avg_risk = round(sum(d["risk_scores"]) / len(d["risk_scores"]), 1) if d["risk_scores"] else 0
        click_rate = round(d["total_clicked"] / d["total_sent"] * 100, 1) if d["total_sent"] > 0 else 0
        report_rate = round(d["total_reported"] / d["total_sent"] * 100, 1) if d["total_sent"] > 0 else 0
        submission_rate = round(d["total_submitted"] / d["total_sent"] * 100, 1) if d["total_sent"] > 0 else 0
        result.append({
            "department": dept,
            "total_users": d["total_users"],
            "total_sent": d["total_sent"],
            "total_clicked": d["total_clicked"],
            "total_reported": d["total_reported"],
            "total_submitted": d["total_submitted"],
            "total_trained": d["total_trained"],
            "avg_risk_score": avg_risk,
            "click_rate": click_rate,
            "report_rate": report_rate,
            "submission_rate": submission_rate,
        })

    result.sort(key=lambda x: x["click_rate"], reverse=True)
    return result
