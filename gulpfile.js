var gulp       = require("gulp");
    sourcemaps = require("gulp-sourcemaps"),
    babel      = require("gulp-babel"),
    watch      = require('gulp-watch');

gulp.task("default", function () {
  return gulp.src("app.js")
    .pipe(watch("app.js"))
    .pipe(sourcemaps.init())
    .pipe(babel())
    .on('error', console.error.bind(console))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest("dist"));
});