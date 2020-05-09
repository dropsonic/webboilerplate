// https://css-tricks.com/gulp-for-beginners/

import * as gulp from 'gulp';
import gulpts from 'gulp-typescript';
import gulpsass from 'gulp-sass';
import sourcemaps from 'gulp-sourcemaps';
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
		.pipe(sourcemaps.init())
		.pipe(gulpsass())
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('dist/css'))
		.pipe(browser.stream({ match: '**/*.css' }));
}

function ts() {
	// prettier-ignore
	return tsProject.src()
		.pipe(sourcemaps.init())
		.pipe(tsProject())
		.js
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('dist/js'))
		.pipe(browser.stream({ match: '**/*.js' }));
}

function clean(done: () => void) {
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

function browserSyncReload(done: () => void) {
	bsync.reload();
	done();
}

function watchImpl(done: () => void) {
	gulp.watch('src/**/*.ts', ts);
	gulp.watch('src/**/*.scss', sass);
	gulp.watch('src/*.html', html);
	gulp.watch('dist/*.html', browserSyncReload);
	done();
}

const watch = gulp.series(build, watchImpl, browserSync);

export { html, sass, ts, clean, build, watch };
export default watch;
