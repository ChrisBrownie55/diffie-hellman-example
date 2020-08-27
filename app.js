const connectLivereload = require('connect-livereload');
const cookieParser = require('cookie-parser');
const createError = require('http-errors');
const express = require('express');
const livereload = require('livereload');
const logger = require('morgan');
const path = require('path');
const sassMiddleware = require('node-sass-middleware');
const {getClientIp} = require('@supercharge/request-ip');

const liveReloadServer = livereload.createServer({
	exts: ['html', 'pug', 'css', 'sass', 'js', 'json', 'png', 'jpg', 'gif'],
	port: 35729,
});
liveReloadServer.watch(path.join(__dirname, 'public'));
liveReloadServer.watch(path.join(__dirname, 'views'));
liveReloadServer.server.once('connection', () => {
	setTimeout(() => {
		liveReloadServer.refresh('/');
	}, 100);
});

const app = express();
app.use(connectLivereload({port: 35729}));
app.use((req, res, next) => {
	req.ip = getClientIp(req);
	next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(
	sassMiddleware({
		src: path.join(__dirname, 'public'),
		dest: path.join(__dirname, 'public'),
		indentedSyntax: true, // true = .sass and false = .scss
		sourceMap: true,
	}),
);
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', require('./routes/index'));
app.use('/establish-keys', require('./routes/establish-keys'));

// catch 404 and forward to error handler
app.use((req, res, next) => {
	next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

module.exports = app;
