// https://css-tricks.com/gulp-for-beginners/

import { src, dest, series, parallel, watch as fwatch } from 'gulp';
import tstranspiler from 'gulp-typescript';
import transpilesass from 'gulp-sass';
import sourcemaps from 'gulp-sourcemaps';
import rename from 'gulp-rename';
import uglify from 'gulp-uglify';
import cache from 'gulp-cache';
import imagemin from 'gulp-imagemin';
import autoprefixer from 'gulp-autoprefixer';
import bsync from 'browser-sync';
import del from 'del';

const globs = {
	src: {
		html: 'src/*.html',
		images: 'src/img/**/*.+(png|jpg|jpeg|gif|svg)',
		sass: 'src/scss/**/*.scss',
		ts: 'src/ts/**/*.ts'
	},
	dest: {
		dirs: {
			root: 'dist',
			images: 'dist/img',
			css: 'dist/css',
			js: 'dist/js'
		},
		html: 'dist/*.html',
		images: 'dist/img/**/*.+(png|jpg|jpeg|gif|svg)'
	},
	css: '**/*.css',
	js: '**/*.js',
	tsconfig: 'tsconfig.json'
};

const tsProject = tstranspiler.createProject(globs.tsconfig);
const browser = bsync.create();

function html() {
	// prettier-ignore
	return src(globs.src.html)
		.pipe(dest(globs.dest.dirs.root));
}

function images() {
	// prettier-ignore
	return src(globs.src.images)
		.pipe(cache(imagemin()))
		.pipe(dest(globs.dest.dirs.images));
}

function sass() {
	// prettier-ignore
	return src(globs.src.sass)
		.pipe(sourcemaps.init())
		.pipe(transpilesass())
		.pipe(autoprefixer())
		.pipe(sourcemaps.write('.'))
		.pipe(dest(globs.dest.dirs.css))
		.pipe(browser.stream({ match: globs.css }));
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
		.pipe(dest(globs.dest.dirs.js))
		.pipe(browser.stream({ match: globs.js }));
}

function clean(done: (err?: Error) => void) {
	del.sync(globs.dest.dirs.root);
	done();
}

const build = series(clean, parallel(html, images, ts, sass));

function browserSync() {
	bsync.init({
		server: {
			baseDir: globs.dest.dirs.root
		}
		// files: [ 'dist/*.html', 'dist/**/*.css', 'dist/**/*.js' ]
	});
}

function browserSyncReload(done: (err?: Error) => void) {
	bsync.reload();
	done();
}

function watchImpl(done: (err?: Error) => void) {
	fwatch(globs.src.ts, ts);
	fwatch(globs.src.sass, sass);
	fwatch(globs.src.html, html);
	fwatch(globs.src.images, images);
	fwatch(globs.dest.html, browserSyncReload);
	fwatch(globs.dest.images, browserSyncReload);
	done();
}

const watch = series(build, watchImpl, browserSync);

export { html, images, sass, ts, clean, build, watch };
export default watch;
