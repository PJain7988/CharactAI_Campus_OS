const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

const certDir = path.join(__dirname, '..', '..', 'uploads', 'certificates');
fs.mkdirSync(certDir, { recursive: true });

function generateCertificateCode() {
  const year = new Date().getFullYear();
  const rand = uuidv4().split('-')[0].toUpperCase();
  return `CHAI-${year}-${rand}`;
}

/**
 * Renders the one-page Certificate of Holistic Student Development (Section 28-29)
 * as a PDF with an embedded QR code pointing at the public, privacy-safe
 * verification page.
 */
async function generateCertificatePdf({ student, user, assessment, narrative, certificateCode, verifyUrl }) {
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
      .text('CERTIFICATE OF HOLISTIC STUDENT DEVELOPMENT', { align: 'center' })
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

module.exports = { generateCertificateCode, generateCertificatePdf, certDir };
