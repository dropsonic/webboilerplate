const { src, dest, series, parallel, watch: fwatch } = require('gulp');
const tstranspiler = require('gulp-typescript');
const transpilesass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const rename = require('gulp-rename');
const uglify = require('gulp-uglify');
const cache = require('gulp-cache');
const imagemin = require('gulp-imagemin');
const autoprefixer = require('gulp-autoprefixer');
const cleancss = require('gulp-clean-css');
const sassLint = require('gulp-sass-lint');
const eslint = require('gulp-eslint');
const htmlhint = require('gulp-htmlhint');
const plumber = require('gulp-plumber');
const concat = require('gulp-concat');
const bsync = require('browser-sync');
const del = require('del');
const path = require('path');
const slash = require('slash');
const merge = require('merge-stream');

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
	sassLintConfig: '.sass-lint.yml',
	materializecss: {
		css: 'materialize-css/dist/css/materialize.min.css',
		js: 'materialize-css/dist/js/materialize.min.js',
		nouislider: {
			css: 'materialize-css/extras/noUiSlider/nouislider.css',
			js: 'materialize-css/extras/noUiSlider/nouislider.min.js'
		}
	}
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
		.pipe(transpilesass({ includePaths: require('scss-resets').includePaths.map(slash) }))
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

function vendors() {
	const resolve = (p) => slash(require.resolve(p));
	// prettier-ignore
	return merge(
		src(resolve(globs.materializecss.css))
			.pipe(dest(globs.dest.dirs.css)),
		src(resolve(globs.materializecss.js))
			.pipe(dest(globs.dest.dirs.js)),
		src(resolve(globs.materializecss.nouislider.css))
			.pipe(dest(globs.dest.dirs.css)),
		src(resolve(globs.materializecss.nouislider.js))
			.pipe(dest(globs.dest.dirs.js)));
}

function clean(done) {
	del.sync(globs.dest.dirs.root);
	done();
}

const build = series(clean, parallel(html, vendors, images, ts, sass));

function browserSync() {
	bsync.init({
		server: {
			baseDir: globs.dest.dirs.root
		}
		// files: [ 'dist/*.html', 'dist/**/*.css', 'dist/**/*.js' ]
	});
}

function browserSyncReload(done) {
	bsync.reload();
	done();
}

function watchImpl(done) {
	fwatch(globs.src.ts, ts);
	fwatch(globs.src.sass, sass);
	fwatch(globs.src.html, html);
	fwatch(globs.src.images, images);
	fwatch(globs.dest.html, browserSyncReload);
	fwatch(globs.dest.images, browserSyncReload);
	done();
}

const watch = series(build, watchImpl, browserSync);

exports.html = html;
exports.images = images;
exports.sass = sass;
exports.ts = ts;
exports.vendors = vendors;
exports.clean = clean;
exports.build = build;
exports.watch = watch;
exports.default = watch;
