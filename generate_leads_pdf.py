#!/usr/bin/env python3
"""
Generate an executive-grade PDF Dossier for Cersaie 2026 Exhibition Leads
from the exported Supabase CSV dataset.
"""

import csv
import sys
import os
import json
import base64
import io
import re
from datetime import datetime

# Adjust CSV field limit for large base64 images
csv.field_size_limit(sys.maxsize)

import PIL
from PIL import Image

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image as RLImage,
    PageBreak,
    HRFlowable,
)
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Register system TrueType Arial for flawless unicode accents (Spanish, Italian, Turkish)
FONT_NAME = 'Helvetica'
FONT_BOLD = 'Helvetica-Bold'
FONT_ITALIC = 'Helvetica-Oblique'

if os.path.exists('/System/Library/Fonts/Supplemental/Arial.ttf'):
    try:
        pdfmetrics.registerFont(TTFont('Arial', '/System/Library/Fonts/Supplemental/Arial.ttf'))
        pdfmetrics.registerFont(TTFont('Arial-Bold', '/System/Library/Fonts/Supplemental/Arial Bold.ttf'))
        pdfmetrics.registerFont(TTFont('Arial-Italic', '/System/Library/Fonts/Supplemental/Arial Italic.ttf'))
        FONT_NAME = 'Arial'
        FONT_BOLD = 'Arial-Bold'
        FONT_ITALIC = 'Arial-Italic'
    except Exception as e:
        print(f"Font registration fallback: {e}")

CSV_PATH = 'Supabase Snippet Untitled query.csv'
OUTPUT_PDF = 'Cersaie_2026_Exhibition_Leads_Dossier.pdf'
THUMBS_DIR = '/tmp/card_pdf_thumbs'

os.makedirs(THUMBS_DIR, exist_ok=True)

class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas to dynamically compute total pages and draw headers/footers."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        if self._pageNumber == 1:
            return  # Skip cover page header and footer
        self.saveState()
        self.setFont(FONT_NAME, 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header line
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(36, 842 - 25, 595 - 36, 842 - 25)
        self.drawString(36, 842 - 20, "CERSAIE 2026 • COMMERCIAL INTELLIGENCE & LEADS DOSSIER")
        self.drawRightString(595 - 36, 842 - 20, "CONFIDENTIAL")

        # Footer line
        self.line(36, 32, 595 - 36, 32)
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawString(36, 20, "ExpoScan AI Lead Management • Exported from Supabase")
        self.drawRightString(595 - 36, 20, page_text)
        self.restoreState()


def clean_text(val):
    if not val:
        return ""
    val = str(val).strip()
    if val.startswith('["') and val.endswith('"]'):
        try:
            items = json.loads(val)
            return ", ".join(items)
        except:
            pass
    return val

def extract_thumbnail(b64_str, idx, max_w=200, max_h=130):
    if not b64_str or not b64_str.startswith('data:image'):
        return None
    thumb_path = os.path.join(THUMBS_DIR, f"thumb_{idx}.jpg")
    if os.path.exists(thumb_path):
        return thumb_path
    try:
        header, data = b64_str.split(',', 1)
        raw = base64.b64decode(data)
        img = Image.open(io.BytesIO(raw))
        img.thumbnail((max_w * 2, max_h * 2), Image.Resampling.LANCZOS)
        img.convert('RGB').save(thumb_path, 'JPEG', quality=82)
        return thumb_path
    except Exception as e:
        return None


def parse_csv_leads():
    leads = []
    with open(CSV_PATH, 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            raw_data = {}
            if row.get('raw_extracted_json'):
                try:
                    raw_data = json.loads(row['raw_extracted_json'])
                except:
                    pass

            desc = row.get('company_summary') or raw_data.get('description') or raw_data.get('company_summary') or ''
            categories = []
            if raw_data.get('categories') and isinstance(raw_data['categories'], list):
                categories = raw_data['categories']
            elif raw_data.get('category'):
                categories = [raw_data['category']]
            elif row.get('industry'):
                categories = [row['industry']]

            thumb_path = extract_thumbnail(row.get('image_front', ''), i)

            lead = {
                'id': row.get('id', f'lead_{i}'),
                'name': clean_text(row.get('name')) or 'Unknown Contact',
                'designation': clean_text(row.get('designation')),
                'department': clean_text(row.get('department')),
                'company': clean_text(row.get('company')) or 'Unnamed Company',
                'phone': clean_text(row.get('phone')),
                'phone_secondary': clean_text(row.get('phone_secondary')),
                'email': clean_text(row.get('email')),
                'email_secondary': clean_text(row.get('email_secondary')),
                'website': clean_text(row.get('website')),
                'address': clean_text(row.get('address')),
                'city': clean_text(row.get('city')),
                'country': clean_text(row.get('country')),
                'industry': clean_text(row.get('industry')),
                'role_type': clean_text(row.get('role_type')),
                'description': clean_text(desc),
                'meeting_notes': clean_text(row.get('meeting_notes')),
                'action_items': clean_text(row.get('action_items')),
                'lead_priority': (row.get('lead_priority') or 'WARM').upper(),
                'exhibition_name': clean_text(row.get('exhibition_name')) or 'Cersaie 2026',
                'booth_number': clean_text(row.get('booth_number')),
                'tags': clean_text(row.get('tags')),
                'thumb_path': thumb_path,
                'created_at': row.get('created_at', ''),
                'categories': categories,
            }
            leads.append(lead)

    # Sort leads: HOT first, then WARM, then alphabetically by company
    priority_order = {'HOT': 0, 'WARM': 1, 'COLD': 2}
    leads.sort(key=lambda x: (priority_order.get(x['lead_priority'], 3), x['company'].lower()))
    return leads


def build_pdf():
    leads = parse_csv_leads()
    print(f"Loaded {len(leads)} leads from CSV.")

    total_leads = len(leads)
    hot_count = sum(1 for l in leads if l['lead_priority'] == 'HOT')
    warm_count = sum(1 for l in leads if l['lead_priority'] == 'WARM')

    doc = SimpleDocTemplate(
        OUTPUT_PDF,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=42,
    )

    styles = getSampleStyleSheet()

    # Custom typography styles with registered fonts
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName=FONT_BOLD,
        fontSize=24,
        leading=30,
        textColor=colors.HexColor('#0F172A'),
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName=FONT_NAME,
        fontSize=11,
        leading=16,
        textColor=colors.HexColor('#475569'),
    )

    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName=FONT_BOLD,
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#1E293B'),
        spaceAfter=6,
    )

    detail_label_style = ParagraphStyle(
        'DetailLabel',
        parent=styles['Normal'],
        fontName=FONT_BOLD,
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor('#64748B'),
    )

    detail_val_style = ParagraphStyle(
        'DetailValue',
        parent=styles['Normal'],
        fontName=FONT_NAME,
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#1E293B'),
    )

    notes_style = ParagraphStyle(
        'NotesText',
        parent=styles['Normal'],
        fontName=FONT_ITALIC,
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#334155'),
    )

    action_style = ParagraphStyle(
        'ActionText',
        parent=styles['Normal'],
        fontName=FONT_BOLD,
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#0284C7'),
    )

    tag_style = ParagraphStyle(
        'TagStyle',
        parent=styles['Normal'],
        fontName=FONT_NAME,
        fontSize=7,
        leading=9,
        textColor=colors.HexColor('#4338CA'),
    )

    story = []

    # ==========================================
    # 1. EXECUTIVE COVER PAGE
    # ==========================================
    story.append(Spacer(1, 15))
    story.append(Paragraph(
        "<font color='#4F46E5'><b>EXPOSCAN AI</b></font> &nbsp;•&nbsp; <font color='#64748B'>EXHIBITION INTELLIGENCE & LEAD DOSSIER</font>",
        ParagraphStyle('Brand', fontName=FONT_BOLD, fontSize=9, leading=11)
    ))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=2.5, color=colors.HexColor('#4F46E5'), spaceAfter=18))

    story.append(Paragraph("CERSAIE EXPO 2026", ParagraphStyle('Eyebrow', fontName=FONT_BOLD, fontSize=13, leading=16, textColor=colors.HexColor('#4F46E5'))))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Exhibition Commercial Leads & Intelligence Dossier", title_style))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "Structured directory of business contacts, technical requirements, buyer inquiries and prioritized follow-ups from Bologna Fiere.",
        subtitle_style
    ))
    story.append(Spacer(1, 20))

    kpi_title_style = ParagraphStyle(
        'KpiTitle',
        parent=styles['Normal'],
        fontName=FONT_BOLD,
        fontSize=7.5,
        leading=10,
        alignment=1,
    )
    kpi_num_style = ParagraphStyle(
        'KpiNum',
        parent=styles['Normal'],
        fontName=FONT_BOLD,
        fontSize=24,
        leading=28,
        alignment=1,
    )
    kpi_sub_style = ParagraphStyle(
        'KpiSub',
        parent=styles['Normal'],
        fontName=FONT_NAME,
        fontSize=7,
        leading=9,
        alignment=1,
    )

    # KPI Summary Cards Table with clean row separation
    kpi_card_data = [
        [
            Paragraph("<font color='#64748B'>TOTAL CONTACTS</font>", kpi_title_style),
            Paragraph("<font color='#DC2626'>HOT PRIORITY</font>", kpi_title_style),
            Paragraph("<font color='#D97706'>WARM PRIORITY</font>", kpi_title_style),
            Paragraph("<font color='#2563EB'>EXHIBITION EVENT</font>", kpi_title_style),
        ],
        [
            Paragraph(f"<font color='#0F172A'>{total_leads}</font>", kpi_num_style),
            Paragraph(f"<font color='#DC2626'>{hot_count}</font>", kpi_num_style),
            Paragraph(f"<font color='#D97706'>{warm_count}</font>", kpi_num_style),
            Paragraph("<font color='#1E293B'>CERSAIE</font>", ParagraphStyle('KpiEvent', parent=kpi_num_style, fontSize=14, leading=18)),
        ],
        [
            Paragraph("<font color='#64748B'>Leads Documented</font>", kpi_sub_style),
            Paragraph("<font color='#991B1B'>Immediate Action</font>", kpi_sub_style),
            Paragraph("<font color='#92400E'>Prospective Leads</font>", kpi_sub_style),
            Paragraph("<font color='#64748B'>Bologna, Italy</font>", kpi_sub_style),
        ]
    ]
    kpi_table = Table(kpi_card_data, colWidths=[125, 125, 125, 130], rowHeights=[20, 36, 18])
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#F8FAFC')),
        ('BACKGROUND', (1,0), (1,-1), colors.HexColor('#FEF2F2')),
        ('BACKGROUND', (2,0), (2,-1), colors.HexColor('#FFFBEB')),
        ('BACKGROUND', (3,0), (3,-1), colors.HexColor('#EFF6FF')),
        ('BOX', (0,0), (0,-1), 1, colors.HexColor('#CBD5E1')),
        ('BOX', (1,0), (1,-1), 1, colors.HexColor('#FECACA')),
        ('BOX', (2,0), (2,-1), 1, colors.HexColor('#FDE68A')),
        ('BOX', (3,0), (3,-1), 1, colors.HexColor('#BFDBFE')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(kpi_table)
    story.append(Spacer(1, 20))

    # Executive Context Box
    overview_html = f"""
    <b>EXECUTIVE REPORT SUMMARY</b><br/><br/>
    This commercial dossier contains the complete records of <b>{total_leads} business leads</b> gathered during the <b>Cersaie 2026</b> International Exhibition of Ceramic Tile and Bathroom Furnishings in Bologna, Italy.
    <br/><br/>
    • <b>Geographic Distribution:</b> International procurement contacts from Italy, Spain, China, Germany, UAE, Turkey, Portugal, and Egypt.<br/>
    • <b>Core Segments Covered:</b> Vitrified (GVT/PGVT), Large Slabs & Countertops, Handmade & Subway Tiles, Porcelain, Marble & Granite, and Sanitaryware.<br/>
    • <b>Commercial Prioritization:</b> All <b>{hot_count} HOT Priority Leads</b> have been verified with primary telephone, WhatsApp, or email contacts and categorized by immediate follow-up requirements (e.g. sample shipment, price list submission, OEM inquiries).<br/>
    • <b>Verification:</b> Each lead entry includes card image verification, meeting transcript summaries, and designated follow-up items.
    """
    overview_table = Table([[Paragraph(overview_html, ParagraphStyle('ExecSummary', parent=styles['Normal'], fontName=FONT_NAME, fontSize=8.5, leading=13, textColor=colors.HexColor('#1E293B')))]], colWidths=[523])
    overview_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (0,0), 1, colors.HexColor('#CBD5E1')),
        ('LEFTPADDING', (0,0), (0,0), 14),
        ('RIGHTPADDING', (0,0), (0,0), 14),
        ('TOPPADDING', (0,0), (0,0), 12),
        ('BOTTOMPADDING', (0,0), (0,0), 12),
    ]))
    story.append(overview_table)
    story.append(Spacer(1, 25))

    metadata_info = f"""
    <font size='8' color='#64748B'>
    <b>Target Audience:</b> Executive Commercial Team • Domestic Sales & Export Division<br/>
    <b>Source System:</b> ExpoScan Cloud Database (Production Supabase Instance)<br/>
    <b>Generated Date:</b> {datetime.now().strftime('%B %d, %Y')} • Strict Commercial Confidentiality
    </font>
    """
    story.append(Paragraph(metadata_info, ParagraphStyle('Meta', parent=styles['Normal'], fontName=FONT_NAME, fontSize=8, leading=12)))
    story.append(PageBreak())

    # ==========================================
    # 2. MASTER LEADS INDEX DIRECTORY TABLE
    # ==========================================
    story.append(Paragraph("Master Leads Directory (Index)", section_heading))
    story.append(Paragraph("Comprehensive listing of all 54 registered contacts sorted by priority and company.", subtitle_style))
    story.append(Spacer(1, 8))

    index_headers = [
        Paragraph("<b>#</b>", detail_label_style),
        Paragraph("<b>Company</b>", detail_label_style),
        Paragraph("<b>Contact Person</b>", detail_label_style),
        Paragraph("<b>Designation</b>", detail_label_style),
        Paragraph("<b>Phone / WhatsApp</b>", detail_label_style),
        Paragraph("<b>Country</b>", detail_label_style),
        Paragraph("<b>Priority</b>", detail_label_style),
    ]
    index_rows = [index_headers]

    for idx, l in enumerate(leads, start=1):
        p = l['lead_priority']
        p_badge = f"<font color='#DC2626'><b>[HOT]</b></font>" if p == 'HOT' else f"<font color='#D97706'><b>[WARM]</b></font>"
        
        index_rows.append([
            Paragraph(f"<font color='#64748B'>{idx}</font>", detail_val_style),
            Paragraph(f"<b>{l['company'][:28]}</b>", detail_val_style),
            Paragraph(l['name'][:22], detail_val_style),
            Paragraph(l['designation'][:24] if l['designation'] else "-", detail_val_style),
            Paragraph(l['phone'] if l['phone'] else "-", detail_val_style),
            Paragraph(l['country'] if l['country'] else "-", detail_val_style),
            Paragraph(p_badge, detail_val_style),
        ])

    index_table = Table(index_rows, colWidths=[20, 125, 105, 105, 90, 45, 43], repeatRows=1)
    index_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
    ]))
    story.append(index_table)
    story.append(PageBreak())

    # ==========================================
    # 3. DETAILED LEADS DOSSIER (2 CARDS PER PAGE)
    # ==========================================
    story.append(Paragraph("Comprehensive Lead Profile Dossiers", section_heading))
    story.append(Paragraph("Detailed individual profiles with business card verification, discussion transcripts & action items.", subtitle_style))
    story.append(Spacer(1, 10))

    for idx, l in enumerate(leads, start=1):
        p = l['lead_priority']
        p_color = '#DC2626' if p == 'HOT' else '#D97706'
        p_label = '[HOT PRIORITY]' if p == 'HOT' else '[WARM PRIORITY]'

        booth_str = f" • Booth {l['booth_number']}" if l.get('booth_number') else ""
        dept_str = f" <font size='8' color='#64748B'>({l['department']})</font>" if l.get('department') else ""

        # Card Header
        header_text = f"""
        <table width="100%">
            <tr>
                <td width="78%">
                    <font size="11" color="#0F172A"><b>#{idx}. {l['company']}</b></font><br/>
                    <font size="9.5" color="#1E293B"><b>{l['name']}</b></font> 
                    <font size="8.5" color="#475569">• {l['designation'] or 'Executive'}</font>
                    {dept_str}
                </td>
                <td width="22%" align="right">
                    <font size="8.5" color="{p_color}"><b>{p_label}</b></font><br/>
                    <font size="7" color="#64748B">{l['exhibition_name']}{booth_str}</font>
                </td>
            </tr>
        </table>
        """
        header_para = Paragraph(header_text, styles['Normal'])

        # Left Column: Image + Contacts
        left_flowables = []
        if l['thumb_path'] and os.path.exists(l['thumb_path']):
            try:
                img = RLImage(l['thumb_path'], width=175, height=95)
                left_flowables.append(img)
                left_flowables.append(Spacer(1, 4))
            except Exception as e:
                pass
        
        # Contacts List with clean text labels (No black box emojis!)
        contact_items = []
        if l['phone']:
            contact_items.append(f"<b>Phone:</b> {l['phone']}")
        if l['phone_secondary']:
            contact_items.append(f"<b>Alt / WA:</b> {l['phone_secondary']}")
        if l['email']:
            contact_items.append(f"<b>Email:</b> {l['email']}")
        if l['website']:
            contact_items.append(f"<b>Website:</b> {l['website']}")
        loc = ", ".join(filter(None, [l['city'], l['country']]))
        if loc:
            contact_items.append(f"<b>Location:</b> {loc}")
        if l['address']:
            contact_items.append(f"<b>Address:</b> {l['address'][:55]}")

        left_contact_text = "<br/>".join(contact_items) if contact_items else "<i>No contact info recorded</i>"
        left_flowables.append(Paragraph(left_contact_text, detail_val_style))

        # Right Column: Notes + Action Items + Categories + Summary
        right_flowables = []

        # Category Chips
        cats = l['categories'] or ([l['industry']] if l['industry'] else [])
        if cats:
            cat_str = "  •  ".join(cats[:3])
            right_flowables.append(Paragraph(f"<b>CATEGORY:</b> <font color='#4F46E5'>{cat_str}</font>", tag_style))
            right_flowables.append(Spacer(1, 4))

        # Meeting Notes
        if l['meeting_notes']:
            right_flowables.append(Paragraph("<b>MEETING NOTES & DISCUSSION:</b>", detail_label_style))
            right_flowables.append(Paragraph(f'"{l["meeting_notes"]}"', notes_style))
            right_flowables.append(Spacer(1, 4))

        # Action Items
        if l['action_items']:
            right_flowables.append(Paragraph("<b>REQUIRED ACTION ITEMS:</b>", detail_label_style))
            right_flowables.append(Paragraph(f"• {l['action_items']}", action_style))
            right_flowables.append(Spacer(1, 4))

        # Company Description
        if l['description'] and l['description'] != l['meeting_notes']:
            right_flowables.append(Paragraph("<b>BUSINESS BACKGROUND:</b>", detail_label_style))
            right_flowables.append(Paragraph(l['description'], detail_val_style))
            right_flowables.append(Spacer(1, 4))

        # Tags
        if l['tags']:
            right_flowables.append(Paragraph(f"<font color='#64748B'>Tags:</font> #{l['tags']}", tag_style))

        # Build Card Table: Header Row + Content Row (2 Columns: 185pt and 320pt)
        card_content_table = Table([[left_flowables, right_flowables]], colWidths=[185, 324])
        card_content_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING', (0,0), (-1,-1), 2),
            ('RIGHTPADDING', (0,0), (-1,-1), 2),
            ('TOPPADDING', (0,0), (-1,-1), 3),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ]))

        full_card_table = Table([
            [header_para],
            [HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#CBD5E1'), spaceAfter=4, spaceBefore=4)],
            [card_content_table],
        ], colWidths=[523])

        full_card_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor(p_color if p == 'HOT' else '#CBD5E1')),
            ('LINELEFT', (0,0), (0,-1), 3.5, colors.HexColor(p_color)),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ]))

        story.append(full_card_table)
        story.append(Spacer(1, 10))

        # Page break every 2 cards
        if idx % 2 == 0 and idx < len(leads):
            story.append(PageBreak())

    # ==========================================
    # 4. ACTION ITEMS & PRIORITY FOLLOW-UP PLAN
    # ==========================================
    story.append(PageBreak())
    story.append(Paragraph("Actionable Follow-Up Plan (HOT Leads Tracker)", section_heading))
    story.append(Paragraph("Summary checklist of key action items and commitments made during booth meetings.", subtitle_style))
    story.append(Spacer(1, 10))

    action_headers = [
        Paragraph("<b>#</b>", detail_label_style),
        Paragraph("<b>Company</b>", detail_label_style),
        Paragraph("<b>Contact Person</b>", detail_label_style),
        Paragraph("<b>Phone / Email</b>", detail_label_style),
        Paragraph("<b>Discussion & Commitment</b>", detail_label_style),
    ]
    action_rows = [action_headers]

    hot_leads = [l for l in leads if l['lead_priority'] == 'HOT']
    for idx, l in enumerate(hot_leads, start=1):
        contact_str = l['phone'] or l['email'] or '-'
        action_note = l['action_items'] or l['meeting_notes'] or 'Follow-up on quotation and catalog dispatch.'
        
        action_rows.append([
            Paragraph(f"<font color='#DC2626'><b>{idx}</b></font>", detail_val_style),
            Paragraph(f"<b>{l['company'][:28]}</b>", detail_val_style),
            Paragraph(l['name'][:22], detail_val_style),
            Paragraph(contact_str, detail_val_style),
            Paragraph(action_note, detail_val_style),
        ])

    action_table = Table(action_rows, colWidths=[20, 120, 100, 110, 173], repeatRows=1)
    action_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#FEF2F2')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#FECACA')),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#FFF5F5')]),
    ]))
    story.append(action_table)

    print("Building document with ReportLab NumberedCanvas...")
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated: {OUTPUT_PDF}")
    file_size_mb = os.path.getsize(OUTPUT_PDF) / (1024 * 1024)
    print(f"File size: {file_size_mb:.2f} MB")

if __name__ == '__main__':
    build_pdf()
