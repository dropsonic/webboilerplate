// https://css-tricks.com/gulp-for-beginners/

import * as gulp from 'gulp';
import gulpts from 'gulp-typescript';
import gulpsass from 'gulp-sass';
import gulpsourcemaps from 'gulp-sourcemaps';
import gulprename from 'gulp-rename';
import gulpuglify from 'gulp-uglify';
import bsync from 'browser-sync';
import del from 'del';

const tsProject = gulpts.createProject('tsconfig.json');
const browser = bsync.create();

function html() {
	// prettier-ignore
	return gulp.src('src/*.html')
		.pipe(gulp.dest('dist'));
}

function sass() {
	// prettier-ignore
	return gulp.src('src/**/*.scss')
		.pipe(gulpsourcemaps.init())
		.pipe(gulpsass())
		.pipe(gulpsourcemaps.write('.'))
		.pipe(gulp.dest('dist/css'))
		.pipe(browser.stream({ match: '**/*.css' }));
}

function ts() {
	// prettier-ignore
	return tsProject.src()
		.pipe(gulpsourcemaps.init())
		.pipe(tsProject())
		.js
		.pipe(gulpuglify())
		.pipe(gulprename({ extname: '.min.js' }))
		.pipe(gulpsourcemaps.write('.'))
		.pipe(gulp.dest('dist/js'))
		.pipe(browser.stream({ match: '**/*.js' }));
}

function clean(done: (err?: Error) => void) {
	del.sync('dist');
	done();
}

const build = gulp.parallel(clean, ts, sass, html);

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
	gulp.watch('src/**/*.ts', ts);
	gulp.watch('src/**/*.scss', sass);
	gulp.watch('src/*.html', html);
	gulp.watch('dist/*.html', browserSyncReload);
	done();
}

const watch = gulp.series(build, watchImpl, browserSync);

export { html, sass, ts, clean, build, watch };
export default watch;
