// https://css-tricks.com/gulp-for-beginners/

import { series, parallel, src, dest, task, watch } from 'gulp';
import ts from 'gulp-typescript';
import sass from 'gulp-sass';
import sourcemaps from 'gulp-sourcemaps';
import browserSync from 'browser-sync';
import del from 'del';

const tsProject = ts.createProject('tsconfig.json');
const browser = browserSync.create();

task('sass', function() {
	// prettier-ignore
	return src('src/**/*.scss')
		.pipe(sourcemaps.init())
		.pipe(sass())
		.pipe(sourcemaps.write('.'))
		.pipe(dest('dist/css'))
		.pipe(browser.stream({ match: '**/*.css' }));
});

task('ts', function() {
	// prettier-ignore
	return tsProject.src()
		.pipe(sourcemaps.init())
		.pipe(tsProject())
		.js
		.pipe(sourcemaps.write('.'))
		.pipe(dest('dist/js'))
		.pipe(browser.stream({ match: '**/*.js' }));
});

task('browserSync', function() {
	browserSync.init({
		server: {
			baseDir: 'dist'
		}
		// files: [ 'dist/*.html', 'dist/**/*.css', 'dist/**/*.js' ]
	});
});

task('npm', function() {
	require.resolve('materialize-css');
});

task('browserSyncReload', function(done: () => void) {
	browserSync.reload();
	done();
});
task('clean', function(done: () => void) {
	del.sync('dist');
	done();
});

task('html', function() {
	// prettier-ignore
	return src('src/*.html')
		.pipe(dest('dist'));
});

task('build', parallel(task('clean'), task('ts'), task('sass'), task('html')));

task(
	'watch',
	series(
		task('build'),
		(done: () => void) => {
			watch('src/**/*.ts', task('ts'));
			watch('src/**/*.scss', task('sass'));
			watch('src/*.html', task('html'));
			watch('dist/*.html', task('browserSyncReload'));
			done();
		},
		task('browserSync')
	)
);
