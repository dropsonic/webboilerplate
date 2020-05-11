/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { src, dest, series, parallel, watch as fwatch } from 'gulp';
import tstranspiler from 'gulp-typescript';
import transpilesass from 'gulp-sass';
import sourcemaps from 'gulp-sourcemaps';
import rename from 'gulp-rename';
import uglify from 'gulp-uglify';
import cache from 'gulp-cache';
import imagemin from 'gulp-imagemin';
import autoprefixer from 'gulp-autoprefixer';
const cleancss = require('gulp-clean-css');
const sassLint = require('gulp-sass-lint');
const eslint = require('gulp-eslint');
const htmlhint = require('gulp-htmlhint');
import plumber from 'gulp-plumber';
import concat from 'gulp-concat';
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
	tsConfig: 'tsconfig.json',
	sassLintConfig: '.sass-lint.yml'
};

const tsProject = tstranspiler.createProject(globs.tsConfig);
bsync.create();

function html() {
	// prettier-ignore
	return src(globs.src.html)
		.pipe(htmlhint())
		.pipe(htmlhint.reporter())
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
		.pipe(plumber())
		.pipe(sassLint({ configFile: globs.sassLintConfig }))
		.pipe(sassLint.format())
		.pipe(sassLint.failOnError())
		.pipe(sourcemaps.init())
		.pipe(transpilesass({ includePaths: require('scss-resets').includePaths }))
		.pipe(autoprefixer())
		.pipe(cleancss())
		.pipe(rename({ extname: '.min.css' }))
		.pipe(concat('styles.min.css'))
		.pipe(sourcemaps.write('.'))
		.pipe(dest(globs.dest.dirs.css))
		.pipe(bsync.stream({ match: globs.css }));
}

function ts() {
	// prettier-ignore
	return tsProject.src()
		.pipe(plumber())
		.pipe(eslint())
		.pipe(eslint.format('stylish'))
		.pipe(eslint.failAfterError())
		.pipe(sourcemaps.init())
		.pipe(tsProject())
		.js
		.pipe(uglify())
		.pipe(rename({ extname: '.min.js' }))
		.pipe(concat('scripts.min.js'))
		.pipe(sourcemaps.write('.'))
		.pipe(dest(globs.dest.dirs.js))
		.pipe(bsync.stream({ match: globs.js }));
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
