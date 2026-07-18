const gulp = require("gulp");
const babel = require("gulp-babel");
const uglify = require("gulp-uglify");
const concat = require("gulp-concat");
const header = require('gulp-header');
const pkgJSON = require("./package.json");

const comment =
`/**
* @name ${pkgJSON.name}
* @version ${pkgJSON.version}
* @copyright ${new Date().getFullYear()} 
* @author ${pkgJSON.author}
* @license ${pkgJSON.license}
*/
`;

gulp.task("compile", () => {
  return gulp
    .src("./src/store.js")
    .pipe(concat("store.min.js"))
    // .pipe(babel({ presets: ["@babel/preset-env"] }))
    .pipe(uglify())
    .pipe(header(comment))
    .pipe(gulp.dest("dist"));
});
gulp.task("copy", () => gulp.src("./src/store.js").pipe(header(comment)).pipe(gulp.dest("dist")));

gulp.task("default", gulp.series(["compile", "copy"]));
