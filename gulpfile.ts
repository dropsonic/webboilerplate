// https://css-tricks.com/gulp-for-beginners/

import { src, dest, series, parallel, watch as fwatch } from 'gulp';
import tstranspiler from 'gulp-typescript';
import transpilesass from 'gulp-sass';
import sourcemaps from 'gulp-sourcemaps';
import rename from 'gulp-rename';
import uglify from 'gulp-uglify';
import cache from 'gulp-cache';
import imagemin from 'gulp-imagemin';
import bsync from 'browser-sync';
import del from 'del';

const tsProject = tstranspiler.createProject('tsconfig.json');
const browser = bsync.create();

function html() {
	// prettier-ignore
	return src('src/*.html')
		.pipe(dest('dist'));
}

function images() {
	// prettier-ignore
	return src('src/img/**/*.*')
		.pipe(cache(imagemin()))
		.pipe(dest('dist/img'));
}

function sass() {
	// prettier-ignore
	return src('src/scss/**/*.scss')
		.pipe(sourcemaps.init())
		.pipe(transpilesass())
		.pipe(sourcemaps.write('.'))
		.pipe(dest('dist/css'))
		.pipe(browser.stream({ match: '**/*.css' }));
}

function ts() {
	// prettier-ignore
	return tsProject.src()
		.pipe(sourcemaps.init())
		.pipe(tsProject())
		.js
		.pipe(uglify())
		.pipe(rename({ extname: '.min.js' }))
		.pipe(sourcemaps.write('.'))
		.pipe(dest('dist/js'))
		.pipe(browser.stream({ match: '**/*.js' }));
}

function clean(done: (err?: Error) => void) {
	del.sync('dist');
	done();
}

const build = series(clean, parallel(html, images, ts, sass));

function browserSync() {
	bsync.init({
		server: {
			baseDir: 'dist'
		}
		// files: [ 'dist/*.html', 'dist/**/*.css', 'dist/**/*.js' ]
	});
}

function browserSyncReload(done: (err?: Error) => void) {
	bsync.reload();
	done();
}

function watchImpl(done: (err?: Error) => void) {
	fwatch('src/ts/**/*.ts', ts);
	fwatch('src/scss/**/*.scss', sass);
	fwatch('src/*.html', html);
	fwatch('src/img/**/*.*', images);
	fwatch('dist/*.html', browserSyncReload);
	fwatch('dist/img/**/*.*', browserSyncReload);
	done();
}

const watch = series(build, watchImpl, browserSync);

export { html, images, sass, ts, clean, build, watch };
export default watch;
