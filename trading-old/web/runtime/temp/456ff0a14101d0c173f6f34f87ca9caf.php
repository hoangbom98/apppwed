<?php /*a:1:{s:68:"/www/wwwroot/cs.shangxiang.vip/application/index/view/user/hold.html";i:1707160756;}*/ ?>
<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no" name="viewport"><meta content="yes" name="apple-mobile-web-app-capable"><meta content="black" name="apple-mobile-web-app-status-bar-style"><meta content="telephone=no" name="format-detection"><meta content="email=no" name="format-detection"><title>交易订单</title><link rel="stylesheet" type="text/css" href="/static/newstyle/css/common.css"><link rel="stylesheet" type="text/css" href="/static/newstyle/css/jiaoyi.css"></head><body><div class="app"><div class="app_title">交易订单</div><div class="title"><span class="left-tab active" onclick="change_category(0)">持仓订单</span><span class="right-tab" onclick="change_category(1)">历史订单</span></div><div class="orderlist"><div class="slider-left"></div><div class="slider-right"></div></div></div><div class="tabbar"><li><a href="/index/index/home"><p><img src="/static/newstyle/img/home.png" alt="" class="oneimg"></p><p class="one">行情</p></a></li><li><a href="/index/user/wallet"><p><img src="/static/newstyle/img/shopping.png" alt="" class="twoimg"></p><p class="two">资产</p></a></li><li><a href="/index/user/hold"><p><img src="/static/newstyle/img/money.png" alt="" class="threeimg"></p><p class="three">交易订单</p></a></li><li><a href="https://line.me/R/ti/p/@675uflwe"><p><img src="/static/newstyle/img/wallet.png" alt="" class="fourimg"></p><p class="four">客服</p></a></li><li><a href="/index/user/index"><p><img src="/static/newstyle/img/receipt.png" alt="" class="fiveimg"></p><p class="five">我的</p></a></li></div><script type="text/javascript" src="/static/wap/js/jquery-1.9.1.min.js"></script><script type="text/javascript">
            $(function() {
                var nav = "hold";
                if (nav == "index") {
                    $(".one").addClass("active");
                    $(".oneimg").attr('src', '/static/newstyle/img/home_a.png')
                }
                if (nav == "wallet") {
                    $(".two").addClass("active");
                    $(".twoimg").attr('src', '/static/newstyle/img/shopping_a.png')
                }
                if (nav == "hold") {
                    $(".three").addClass("active");
                    $(".threeimg").attr('src', '/static/newstyle/img/money_a.png')
                }
                if (nav == "yeb") {
                    $(".four").addClass("active");
                    $(".fourimg").attr('src', '/static/newstyle/img/wallet_a.png')
                }
                if (nav == "user") {
                    $(".five").addClass("active");
                    $(".fiveimg").attr('src', '/static/newstyle/img/receipt_a.png')
                }
            })
        </script><script src="/static/newstyle/js/jquery-1.9.1.min.js"></script><script type="text/javascript" src="/static/newstyle/js/order.js"></script><script type="text/javascript" src="/static/newstyle/js/function.js"></script><script type="text/javascript" src="/static/newstyle/js/base64.js"></script><script type="text/javascript">
            var Base64 = new Base64();
        </script><script type="text/javascript">
            var charturl = '/index/user/getchart.html';
            $.get(charturl, function(_res) {
                var res = jQuery.parseJSON(Base64.decode(_res));
                $.each(res, function(k, v) {
                    $('.' + k).html(v);
                })
            })
        </script><script type="text/javascript" src="/static/newstyle/js/hold.js"></script><script type="text/javascript">
            change_category(0)
        </script></body></html>
