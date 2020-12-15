var express = require('express');
var router = express.Router();
var xlsx = require('node-xlsx');
var request = require("request");
var fs = require('fs');
var list = [];
var getDataFun = function (item, callback) {
    var resBody = '';
    var url = 'https://c0.3.cn/stock?skuId='+ item[0] +'&cat=1320,1584,2677&venderId=1000135221&area=1_2800_2848_0&buyNum=1&choseSuitSkuIds=&extraParam={%22originid%22:%221%22}&ch=1&fqsp=0&pduid=1637105155&pdpin=';
    var options = {
        url: url
    }
    request.get(options, function (err, response, body) {
        resBody = JSON.parse(response.body);
        item.push(resBody.stock.jdPrice.p);
        callback(item);
    });

}
var https =require('https');
var dataArr = [];
var  checkData = (data) => {
    for(var i=1; i < data.length ; i++){
        var price = 0;
        var datali = list[i];
        getDataFun(data[i], function (p) {
            dataArr.push(p)
        })
    }
    return dataArr;
}

/* GET home page. */
router.get('/', function (req, res, next) {
    var obj = xlsx.parse('./商品.xlsx');
    var datas = checkData(obj[0]['data']);

    datas.unshift(obj[0]['data'][0]);   
    var buffer = xlsx.build([
        {
            name:'商品信息',
            data:datas   
        }
    ]);
    fs.writeFileSync('商品价格.xlsx',buffer,{'flag':'w'});   //生成excel
    dataArr = [];
    res.render('index', { title: 'Express', resBody: datas });  
});

const settings = {
    headless: true,
    defaultViewport: {
        width: 1200,
        height: 800
    }
  }
router.get('/test',function(req,res,next){
    var html = ''; 

    // var puppeteer  = require('puppeteer')
    // const browser = puppeteer.launch({headless: false});
	// const page = browser.newPage();
    // page.setJavaScriptEnabled(true);
    // page.goto('https://item.jd.com/1225982.html');
    // const dimensions = page.evaluate(() => {
    //     return document.querySelector('body');
    // })
    // console.log('Dimensions:', dimensions);
    // browser.close();
    const puppeteer = require('puppeteer');
 
    (async () => {
        const browser = await puppeteer.launch(settings)
	    const page = await browser.newPage();
        await page.goto('https://item.jd.com/1225982.html');
      
        // const dimensions = await page.evaluate(() => {
        //     return document.querySelector('div.w > div.product-intro > div.itemInfo-wrap');
        // })
        // // var dimensions = page.$eval('div.w > div.product-intro > div.itemInfo-wrap',el => el.innerText)
        // console.log(dimensions);
        await browser.close();
        
    })();
    res.render('test', { title: 'Express', resBody:'测试' });
     
})

router.get('/data',function(req, res, next){
    var resBody = '';
    var url = 'http://cd.jd.com/promotion/v2?skuId='+ req.query.id +'&area=1_72_2799_0&shopId=1000113721&venderId=1000113721&cat=1320%2C1584%2C2677&isCanUseDQ=1&isCanUseJQ=1&platform=0&orgType=2&jdPrice='+req.query.pr;
    var options = {
        url: url
    }
    request.get(options, function (err, response, body) {
        resBody = JSON.parse(response.body);
        res.send(resBody);
    });
    
})
module.exports = router;
