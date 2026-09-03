require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/student.routes');
const activityRoutes = require('./routes/activity.routes');
const verificationRoutes = require('./routes/verification.routes');
const aiRoutes = require('./routes/ai.routes');
const certificateRoutes = require('./routes/certificate.routes');
const adminRoutes = require('./routes/admin.routes');
const recruitmentRoutes = require('./routes/recruitment.routes');
const placementRoutes = require('./routes/placement.routes');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'charactai-backend' }));

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/placement', placementRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
