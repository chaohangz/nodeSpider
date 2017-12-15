const superagent = require('superagent')
const cheerio = require('cheerio')

const url = 'https://movie.douban.com/top250'  // 入口url
const urlPage = 'https://movie.douban.com/top250?start=200'

// 翻页，一次25条，第一页 start=0, 最后一页 start=225
function getUrlArr() {
  let urlArr = []
  for (let i = 0; i< 25; i = i + 25) {
    const newUrl = 'https://movie.douban.com/top250?start=' + i
    urlArr.push(newUrl)
  }
  return urlArr
}

function start() {
  const urlArr = getUrlArr()
  urlArr.map(function(item, key) {
    superagent
    .get(item)
    .end((err, res) => {
      if (err) {
        throw err
      }
      const $ = cheerio.load(res.text)
      const result = $('.hd>a')
      let arr = []
      for (let i = 0; i < 25; i++) {
        console.log(result[i].attribs)
      }
      // console.log(arr)
    })
  })
}

exports.start = start
