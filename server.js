const superagent = require('superagent')
const cheerio = require('cheerio')
const mysql = require('mysql')
const async = require('async')

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

var startTime, endTime
let data = []  // 爬取到的数据

// 翻页，一次25条，第一页 start=0, 最后一页 start=225
function getUrlArr() {
  let urlArr = []
  for (let i = 0; i < 250; i = i + 25) {
    const newUrl = 'https://movie.douban.com/top250?start=' + i
    urlArr.push(newUrl)
  }
  return urlArr
}

// 爬取资源
function queryUrl(url, callback) {
  console.log('正在爬取：' + url)
  superagent
  .get(url)
  .end((err, res) => {
    if (err) {
      throw err
    }
    const $ = cheerio.load(res.text)
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
    // callback的第二个参数会传给下一个函数的result，result是一个数组
    callback(null, 'success')
  })
}

// 存入数据库
function saveData(data) {
  data.forEach(function (item, key) {
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
}

function start() {
  startTime = new Date()
  console.log('开始时间', startTime)
  const urlArr = getUrlArr()

  // 并发控制
  console.log('当前并发数为: 5')
  async.mapLimit(urlArr, 5, function (url, callback) {
    queryUrl(url, callback)
  }, function (err, result) {
    if (err) {
      console.log('爬取url出错了')
      console.log(err)
    } else {
      // console.log('result', result)  // 是个success的数组
      // 爬取结束开始存入数据库
      endTime = new Date()
      console.log('结束时间', endTime)
      console.log('总耗时' + (endTime - startTime) + '毫秒')
      console.log('爬取结束开始存入数据库', data.length)
      saveData(data)
    }
  })
}

exports.start = start
