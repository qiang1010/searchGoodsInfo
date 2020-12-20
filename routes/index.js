var express = require('express');
var router = express.Router();
var xlsx = require('node-xlsx');
var request = require("request");
var fs = require('fs');
var list = [];
var getDataFun = function (item, callback) {
    var resBody = '';

    var url = 'https://c0.3.cn/stock?skuId=' + item[0] + '&cat=1320,1584,2677&venderId=1000135221&area=1_2800_2848_0&buyNum=1&choseSuitSkuIds=&extraParam={%22originid%22:%221%22}&ch=1&fqsp=0&pduid=1637105155&pdpin=';
    var options = {
        url: url
    }
    console.log(url);
    request.get(options, function (err, response, body) {
        resBody = JSON.parse(response.body);
        console.log(resBody);
        // item.push(resBody.stock.jdPrice.p);
        callback(item);
    });

}
var https = require('https');
var dataArr = [];
var checkData = (data) => {
    for (var i = 1; i < data.length; i++) {
        var price = 0;
        var datali = list[i];
        getDataFun(data[1], function (p) {
            dataArr.push(p)
        })
    }
    return dataArr;
}

/* GET home page. */
router.get('/', function (req, res, next) {
    var goodsData = xlsx.parse('./商品.xlsx');
    console.log(goodsData[0]['data'].length, '444');
    // var datas = checkData(obj[0]['data']);
    // datas.unshift(obj[0]['data'][0]);   
    // var buffer = xlsx.build([
    //     {
    //         name:'商品信息',
    //         data:datas   
    //     }
    // ]);
    // fs.writeFileSync('商品价格.xlsx',buffer,{'flag':'w'});   //生成excel
    // dataArr = [];
    res.render('index', { title: 'Express', resBody: goodsData[0]['data'] });
});

const settings = {
    headless: true,
    defaultViewport: {
        width: 1200,
        height: 800
    }
}
router.get('/test', function (req, res, next) {
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
    res.render('test', { title: 'Express', resBody: '测试' });

})

router.get('/data', function (req, res, next) {
    var resBody = '';
    var url = 'https://item-soa.jd.com/getWareBusiness?skuId=' + req.query.id + '&area=1_72_2799_0&shopId=1000113721&venderId=1000113721&cat=1320%2C1584%2C2677&isCanUseDQ=1&isCanUseJQ=1&platform=0&orgType=2&jdPrice=' + req.query.pr;
    var options = {
        url: url
    }
    request.get(options, function (err, response, body) {
        resBody = JSON.parse(response.body);
        res.send(resBody);
    });

})
let getData = function (list, num) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            var resBody = '';
            // var url = 'https://item-soa.jd.com/getWareBusiness?skuId='+ list[num].id +'&area=1_72_2799_0&shopId=1000113721&venderId=1000113721&cat=1320%2C1584%2C2677&isCanUseDQ=1&isCanUseJQ=1&platform=0&orgType=2'
            var url = 'https://item-soa.jd.com/getWareBusiness?skuId=' + list[num][0] + '&cat=1319%2C1526%2C7060&area=1_72_55653_0&shopId=1000196709&venderId=1000196709&paramJson=%7B%22platform2%22%3A%221%22%2C%22specialAttrStr%22%3A%22p0pppp1pppppppppppppp%22%2C%22skuMarkStr%22%3A%2200%22%7D&num=1';

            var options = {
                url: url
            }
            request.get(options, function (err, response) {
                console.log(response);
                if (response && response.body) {
                    resBody = JSON.parse(response.body);
                    resolve({ status: true, price: resBody.price || {}, promotion: resBody.promotion || {}, url });
                } else {
                    resolve({ status: false, error: '获取失败，请重试', err, url });
                }

            });
        }, 200);
    })
}
router.get('/update', function (req, res) {
    let goods = xlsx.parse('./商品.xlsx');
    let goodsData = goods[0]['data'];
    let loopNum = 1;//循环标识
    //定义流程控制函数，递归实现依次调用fn
    let asyncControl = function () {
        // getData(goodsData, 1).then(function (data) {

        //     if (data.status) {
        //         goodsData[loopNum].push(data.price.p || '无价格，在网页上自查');
        //         (data.promotion.activity || []).map((item) => {
        //             goodsData[loopNum].push(item.value || '无折扣，在网页上自查');
        //         })
        //     }
        //     res.send({ goodsData, status: 0, msg: '成功' });
        // });
        if (loopNum < goodsData.length) {//
            getData(goodsData, loopNum).then(function (data) {
                goodsData[loopNum]['info'] = data || {};
                if (data.status) {
                    goodsData[loopNum].push(data.price.p || '无价格，在网页上自查');
                    (data.promotion.activity || []).map((item) => {
                        goodsData[loopNum].push(item.value || '无折扣，在网页上自查');
                    })
                }
                setTimeout(() => {
                    loopNum++;
                    asyncControl();
                }, 100);

            });
        } else {
            var buffer = xlsx.build([
                {
                    name: '商品信息',
                    data: goodsData
                }
            ]);
            fs.writeFileSync('商品.xlsx', buffer, { 'flag': 'w' });   //生成excel
            console.log('数据全部处理完毕');
        }
    }
    //执行流程控制函数
    asyncControl();
    setTimeout(() => {
        res.send({ goodsData, status: 0, msg: '成功' });
    }, 3000);

})
module.exports = router;
