const superagent = require('superagent')
const cheerio = require('cheerio')
const mysql = require('mysql')

// 连接池
const pool = mysql.createPool({
  connectionLimit: 10,  // 限制
  host: 'localhost',
  user: 'root',
  password: 'chaohang',
  database: 'nodespider'
})

// pool.getConnection(function (err, connection) {
//   if (err) throw err
//   connection.query('SELECT * FROM top250', function (err, result) {
//     if (err) throw err
//     console.log(result[0])
    
//     // 释放链接池
//     connection.release()
//   })
// })

const url = 'https://movie.douban.com/top250'  // 入口url
const urlPage = 'https://movie.douban.com/top250?start=200'

// 翻页，一次25条，第一页 start=0, 最后一页 start=225
function getUrlArr() {
  let urlArr = []
  for (let i = 0; i< 250; i = i + 25) {
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
      let data = []
      $('.item').map(function(i, el) {   
        let pic = $(this).children('.pic').children('a').children('img').attr('src')  // 图片
        let info = $(this).children('.info')
        let hd = info.children('.hd')
        let a = hd.children('a')
        let detailHref = a.attr('href')  // 详情地址
        let title = a.children('.title').text()  // 标题
        let playable = hd.children('.playable').text()  // 可播放
        let bd = info.children('.bd')
        let quote = bd.children('.quote').children('.inq').text()  // 引用

        

        data.push({
          pic,
          detailHref,
          title,
          playable,
          quote,
        })
      })

      data.map(function(item, key) {
        // 链接pool
        pool.getConnection(function (err, conn) {
          if (err) throw 'pool err => ' + err
          conn.query('INSERT INTO top250 SET ?', item, function (err, result) {
            if (err) throw 'query err =>' + err
            console.log('插入数据库成功！ID' + result.insertId)
          })
          // 释放pool
          conn.release()
        })
      })
    })
  })
}

exports.start = start
