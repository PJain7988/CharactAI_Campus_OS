const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

const certDir = path.join(__dirname, '..', '..', 'uploads', 'certificates');
fs.mkdirSync(certDir, { recursive: true });

function generateCertificateCode(type = 'HOLISTIC') {
  const year = new Date().getFullYear();
  const rand = uuidv4().split('-')[0].toUpperCase();
  const prefix = type === 'Overall Holistic' ? 'HOL' : type.substring(0, 4).toUpperCase();
  return `CHAI-${prefix}-${year}-${rand}`;
}

/**
 * Renders the one-page Certificate of Holistic Student Development (Section 28-29)
 * as a PDF with an embedded QR code pointing at the public, privacy-safe
 * verification page.
 */
async function generateCertificatePdf({ student, user, assessment, narrative, certificateCode, verifyUrl, certificateType = 'Holistic Development' }) {
  const filePath = path.join(certDir, `${certificateCode}.pdf`);
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 200 });
  const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc
      .fillColor('#0f172a')
      .fontSize(10).font('Helvetica').text('CharactAI', { align: 'center' })
      .moveDown(0.2)
      .fontSize(22).font('Helvetica-Bold')
      .text(`CERTIFICATE OF ${certificateType.toUpperCase()}`, { align: 'center' })
      .moveDown(1);

    doc
      .fontSize(11).font('Helvetica').fillColor('#334155')
      .text('This certifies, based on verified institutional records, that', { align: 'center' })
      .moveDown(0.4)
      .fontSize(20).font('Helvetica-Bold').fillColor('#0f172a')
      .text(user.name, { align: 'center' })
      .moveDown(0.2)
      .fontSize(12).font('Helvetica').fillColor('#334155')
      .text(`${student.program} | Batch ${student.admission_year}-${student.graduation_year}`, { align: 'center' })
      .moveDown(1.2);

    doc
      .fontSize(11).fillColor('#0f172a')
      .text(narrative, { align: 'left', lineGap: 4 })
      .moveDown(1);

    doc.fontSize(13).font('Helvetica-Bold').text('Development Profile', { underline: false }).moveDown(0.4);
    doc.font('Helvetica').fontSize(11);
    const dims = Object.entries(assessment.scores);
    dims.forEach(([dim, score]) => {
      doc.text(`${capitalize(dim)}`, { continued: true, width: 250 });
      doc.text(`  ${score}/100`, { align: 'right' });
    });

    doc.moveDown(0.6);
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#0f172a')
      .text(`Overall Holistic Development Score: ${assessment.overall}/100`);

    doc.moveDown(1.5);
    doc.fontSize(9).fillColor('#64748b').font('Helvetica')
      .text(`Certificate ID: ${certificateCode}`)
      .text(`Issued: ${new Date().toISOString().slice(0, 10)}`)
      .text('This certificate reflects verified, evidence-based development indicators. It does not constitute a moral character judgment.');

    doc.image(qrBuffer, doc.page.width - 170, doc.page.height - 200, { width: 120 });
    doc.fontSize(8).fillColor('#64748b')
      .text('Scan to verify', doc.page.width - 170, doc.page.height - 75, { width: 120, align: 'center' });

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  return filePath;
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

/**
 * Renders an AI-generated ATS-friendly Resume based on verified activities.
 */
async function generateResumePdf({ student, user, assessment, activities }) {
  const filePath = path.join(certDir, `Resume_${user.name.replace(/\s+/g, '_')}_${student.enrollment_no}.pdf`);
  
  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header
    doc
      .fontSize(24).font('Helvetica-Bold').fillColor('#0f172a')
      .text(user.name.toUpperCase(), { align: 'center' })
      .moveDown(0.2)
      .fontSize(10).font('Helvetica').fillColor('#334155')
      .text(`${student.program} | Batch ${student.admission_year}-${student.graduation_year} | ID: ${student.enrollment_no}`, { align: 'center' })
      .text(`Email: ${user.email}`, { align: 'center' })
      .moveDown(1);

    // Line separator
    doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(1).strokeColor('#cbd5e1').stroke();
    doc.moveDown(1);

    // AI Summary
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#0f172a').text('PROFESSIONAL SUMMARY', { underline: true }).moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('#334155').text(
      `Highly motivated ${student.program} student with a verified Holistic Assessment score of ${assessment.overall}/100. Demonstrated excellence in technical execution, leadership, and continuous learning. Proactive team player with a strong track record of campus engagement.`,
      { align: 'justify', lineGap: 3 }
    ).moveDown(1.5);

    // Verified Activities
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#0f172a').text('VERIFIED EXPERIENCE & PROJECTS', { underline: true }).moveDown(0.5);
    
    // Group activities by category, only showing approved ones
    const approved = activities.filter(a => a.verification_status === 'approved');
    const grouped = approved.reduce((acc, act) => {
      acc[act.category_name] = acc[act.category_name] || [];
      acc[act.category_name].push(act);
      return acc;
    }, {});

    Object.entries(grouped).forEach(([cat, items]) => {
      if (['classroom', 'library'].includes(cat) && items.length > 5) {
        // Summarize high volume basic activities
        doc.fontSize(11).font('Helvetica-Bold').text(capitalize(cat)).moveDown(0.2);
        doc.fontSize(10).font('Helvetica').text(`• Consistently engaged with ${items.length} verified ${cat} sessions.`, { indent: 10 }).moveDown(0.5);
      } else {
        doc.fontSize(11).font('Helvetica-Bold').text(capitalize(cat)).moveDown(0.2);
        items.slice(0, 3).forEach(act => {
          doc.fontSize(10).font('Helvetica-Bold').text(`• ${act.title || 'Activity'}`, { indent: 10 });
          if (act.description) {
            doc.fontSize(9).font('Helvetica').text(act.description, { indent: 20 }).moveDown(0.2);
          } else {
            doc.moveDown(0.2);
          }
        });
        doc.moveDown(0.5);
      }
    });

    // Core Competencies
    doc.moveDown(1);
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#0f172a').text('AI-VERIFIED COMPETENCIES', { underline: true }).moveDown(0.5);
    
    const topSkills = Object.entries(assessment.scores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6)
      .map(([k]) => capitalize(k));
      
    doc.fontSize(10).font('Helvetica').text(`Top Strengths: ${topSkills.join(' • ')}`, { indent: 10 });

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  return filePath;
}

module.exports = { generateCertificateCode, generateCertificatePdf, generateResumePdf, certDir };
