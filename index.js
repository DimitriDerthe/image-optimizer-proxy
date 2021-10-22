require('dotenv').config()
const http = require("http");
const parse = require('query-to-json')
const axios = require('axios');
const sharp = require('sharp');

////////////////////////////////////
// Server Settings
const host = '0.0.0.0'
const port = 8080
const origin = process.env.ORIGIN

console.log(new Date(Date.now()), 'ENV origin', process.env.ORIGIN)

////////////////////////////////////
// Start HTTP Server
const requestListener = async function (req, res) {
  let img_url = origin + req.url
  let processingStart = 0
  let processingEnd = 0
  let originStart = 0
  let originEnd = 0
  let contentType = ''
  let contentLength = 0
  let data = null
  let params = {
    dpr: 1,
    q: 60,
    w: null,
    h: null,
    format: null,
    rotate:null,
    flip: false,
    flop: false,
    blur: 0,
    negate: false
  }

  if (img_url.includes('?')){
    let query = img_url.split('?')[1]
    params = parse.queryToJson(query)
  }

  ////////////////////////////////////
  // Get image buffer from origin
  async function imageCrawling(url) {
    originStart = Date.now()

    return axios
    .get(url, {
      responseType: 'arraybuffer'
    })
    .then(response => Buffer.from(response.data, 'binary'))
    .finally(() => {
      originEnd = Date.now()
    })
  }


  ////////////////////////////////////
  // Image processing
  async function imageProcessing(buffer, dpr, q, w, h, format){
    processingStart = Date.now()
    
    q == 'auto' ? q = 60 : q = q

    if (w || h) {
      w ? w = parseInt(w * dpr) : null
      h ? h = parseInt(h * dpr) : null
    }

    buffer = await sharp(buffer)
    .resize({ width: w, height: h })
    .rotate(params.rotate)
    .flip(Boolean(params.flip))
    .flop(Boolean(params.flop))
    .negate(Boolean(params.negate))
    .toBuffer()


    if(format == 'webp') {
      return sharp(buffer)
        .webp({ 
          quality: parseInt(q),
          reductionEffort: 1
        })
        .toBuffer()
        .then(data => {
          contentLength = data.size
          processingEnd = Date.now()
          return data
        });
    }

    if(format == 'avif') {
      return sharp(buffer)
        .avif({
          speed: 9
        })
        .toBuffer()
        .then(data => {
          contentLength = data.size
          processingEnd = Date.now()
          return data
        });
    }

    if(format == 'jpeg') {
      return sharp(buffer)
        .jpeg({ 
          quality: parseInt(q),
          progressive: true,
          mozjpeg: true
        })
        .toBuffer()
        .then(data => {
          contentLength = data.size
          processingEnd = Date.now()
          return data
        });
    }

  }

  ////////////////////////////////////
  //Content-type matrix
  if (req.headers.accept.includes('image/webp') && params.format != 'avif'){
    console.log(new Date(Date.now()),'Image to process:', img_url, 'webp')
    contentType = `image/${params.format || 'webp'}`

    await imageCrawling(img_url)
      .then(async buffer => {
        data = await imageProcessing(buffer, params.dpr || 1, params.q || 60, params.w || null, params.h || null, params.format || 'webp')
      })
      .catch(err => {
        
      })
  }
  else if (req.headers.accept.includes('image/avif')){
    console.log(new Date(Date.now()),'Image to process:', img_url, 'avif')
    contentType = `image/${params.format || 'avif'}`

    await imageCrawling(img_url)
      .then(async buffer => {
        data = await imageProcessing(buffer, params.dpr || 1, params.q || 60, params.w || null, params.h || null, params.format || 'avif')
      })
      .catch(err => {
        
      })
  }
  else {
    console.log(new Date(Date.now()),'Image to process:', img_url, 'jpeg')
    contentType = `image/${params.format || 'jpeg'}`

    await imageCrawling(img_url)
      .then(async buffer => {
        data = await imageProcessing(buffer, params.dpr || 1, params.q || 60, params.w || null, params.h || null, params.format || 'jpeg')
      })
      .catch(err => {
        
      })
  }

  res.writeHead(200,{
    'content-type': contentType,
    'server-timing':`origin_crawling; dur=${originEnd - originStart}, img_processing; dur=${processingEnd - processingStart}`
  });
  res.end(data);
};

const server = http.createServer(requestListener);
server.listen(port, host, () => {
    console.log(new Date(new Date()), `Server is running on http://${host}:${port}`);
});