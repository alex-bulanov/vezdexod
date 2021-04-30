let preprocessor = 'sass', // Preprocessor (sass, less, styl); 'sass' also work with the Scss syntax in blocks/ folder.
  fileswatch = 'html,htm,txt,json,md,woff2' // List of files extensions for watching & hard reload

const {src, dest, parallel, series, watch} = require('gulp')
const browserSync = require('browser-sync').create()
const bssi = require('browsersync-ssi')
const ssi = require('ssi')
const webpack = require('webpack-stream')
const sass = require('gulp-sass')
const sassglob = require('gulp-sass-glob')
const cleancss = require('gulp-clean-css')
const autoprefixer = require('gulp-autoprefixer')
const rename = require('gulp-rename')
const imagemin = require('gulp-imagemin')
const newer = require('gulp-newer')
const rsync = require('gulp-rsync')
const del = require('del')
const spritesmith = require('gulp.spritesmith')
const merge = require('merge-stream')
const webp = require('gulp-webp')
const webpcss = require('gulp-webp-css');
const svgsprite = require('gulp-svg-sprite');

function browsersync() {
  browserSync.init({
    server: {
      baseDir: 'app/',
      middleware: bssi({baseDir: 'app/', ext: '.html'})
    },
    ghostMode: {clicks: false},
    notify: false,
    online: true,
    // tunnel: 'yousutename', // Attempt to use the URL https://yousutename.loca.lt
  })
}

function scripts() {
  return src(['app/js/*.js', '!app/js/*.min.js'])
    .pipe(webpack({
      mode: 'production',
      performance: {hints: false},
      module: {
        rules: [
          {
            test: /\.(js)$/,
            exclude: /(node_modules)/,
            loader: 'babel-loader',
            query: {
              presets: ['@babel/env'],
              plugins: ['babel-plugin-root-import']
            }
          }
        ]
      }
    })).on('error', function handleError() {
      this.emit('end')
    })
    .pipe(rename('app.min.js'))
    .pipe(dest('app/js'))
    .pipe(browserSync.stream())
}

function styles() {
  return src([`app/styles/${preprocessor}/*.*`, `!app/styles/${preprocessor}/_*.*`])
    .pipe(eval(`${preprocessor}glob`)())
    .pipe(eval(preprocessor)())
    .pipe(autoprefixer({overrideBrowserslist: ['last 10 versions'], grid: true}))
    // .pipe(webpcss())
    .pipe(cleancss({level: {1: {specialComments: 0}},/* format: 'beautify' */}))
    .pipe(rename({suffix: ".min"}))
    .pipe(dest('app/css'))
    .pipe(browserSync.stream())
}

function images() {
  return src(['app/images/src/**/*'])
    .pipe(newer('app/images/dist'))
    .pipe(webp({quality: 80}))
    .pipe(dest('app/images/dist'))
    .pipe(src(['app/images/src/**/*']))
    .pipe(imagemin([
      imagemin.gifsicle({interlaced: true}),
      imagemin.mozjpeg({quality: 85, progressive: true}),
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.svgo()
    ]
    ))
    .pipe(dest('app/images/dist'))
    .pipe(browserSync.stream())
}

// Generate png Sprite

function pngSprite() {
  // Generate our spritesheet
  let spriteData = src('app/images/src/png-icons/*.*')
    .pipe(spritesmith({
      imgName: 'sprite.png',
      imgPath: '../images/src/sprite.png',
      cssName: '_sprite.scss',
      retinaSrcFilter: 'app/images/src/png-icons/*@2x.png',
      retinaImgName: 'sprite@2x.png',
      retinaImgPath: '../images/src/sprite@2x.png',
      padding: 20
    }));

  // Pipe image stream onto disk
  let imgStream = spriteData.img
    .pipe(dest('app/images/src/'));

  // Pipe CSS stream onto disk
  let cssStream = spriteData.css
    .pipe(dest('app/styles/sass/_mixins'));

  // Return a merged stream to handle both `end` events
  return merge(imgStream, cssStream);
}


// Generate svg Sprite
function svgSprite() {
  return src('app/images/dist/svg-icons/*.svg')
    .pipe(svgsprite({
      mode: {
        inline: true,
        stack: true
      },
      svg: {
        xmlDeclaration: false,
        doctypeDeclaration: false,
      }
    }))

    .pipe(rename('sprite.svg'))
    .pipe(dest('app/images/src/'))
}

function buildcopy() {
  return src([
    '{app/js,app/css}/*.min.*',
    'app/images/**/*.*',
    '!app/images/src/**/*',
    'app/fonts/**/*'
  ], {base: 'app/'})
    .pipe(dest('dist'))
}

async function buildhtml() {
  let includes = new ssi('app/', 'dist/', '/**/*.html')
  includes.compile()
  del('dist/parts', {force: true})
}

function cleandist() {
  return del('dist/**/*', {force: true})
}

function deploy() {
  return src('dist/')
    .pipe(rsync({
      root: 'dist/',
      hostname: 'username@yousite.com',
      destination: 'yousite/public_html/',
      // clean: true, // Mirror copy with file deletion
      include: [/* '*.htaccess' */], // Included files to deploy,
      exclude: ['**/Thumbs.db', '**/*.DS_Store'],
      recursive: true,
      archive: true,
      silent: false,
      compress: true
    }))
}

function startwatch() {
  watch(`app/styles/${preprocessor}/**/*`, {usePolling: true}, styles)
  watch(['app/js/**/*.js', '!app/js/**/*.min.js'], {usePolling: true}, scripts)
  watch('app/images/src/**/*.{jpg,jpeg,png,webp,svg,gif}', {usePolling: true}, images)
  watch(`app/**/*.{${fileswatch}}`, {usePolling: true}).on('change', browserSync.reload)
}

exports.scripts = scripts
exports.styles = styles
exports.images = images
exports.pngSprite = pngSprite
exports.svgSprite = svgSprite
exports.deploy = deploy
exports.assets = series(scripts, styles, images)
exports.build = series(cleandist, scripts, styles, images, buildcopy, buildhtml)
exports.default = series(scripts, styles, images, parallel(browsersync, startwatch))
