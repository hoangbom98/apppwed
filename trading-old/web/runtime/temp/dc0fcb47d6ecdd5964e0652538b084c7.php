<?php /*a:1:{s:70:"/www/wwwroot/cs.shangxiang.vip/application/index/view/user/wallet.html";i:1707176674;}*/ ?>
<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no" name="viewport"><meta content="yes" name="apple-mobile-web-app-capable"><meta content="black" name="apple-mobile-web-app-status-bar-style"><meta content="telephone=no" name="format-detection"><meta content="email=no" name="format-detection"><title>我的钱包</title><link rel="stylesheet" type="text/css" href="/static/newstyle/css/common.css"><link rel="stylesheet" type="text/css" href="/static/newstyle/css/zichan.css"></head><body><div class="app"><div class="app_title">我的钱包</div><div class="allbox"><div class="sbg"><img src="/static/newstyle/img/wifi.png" alt=""></div><div class="top"><span>总余额</span><img src="/static/newstyle/img/eye-slash.png" alt=""></div><div class="center"><span><?php echo htmlentities($user['money']); ?></span></div><div class="bottom"><a href="/index/user/recharge.html"><div class="sbtn btn1"><img src="/static/newstyle/img/cztx.png" alt=""><span>充值</span></div></a><a href="/index/user/cash.html"><div class="sbtn btn2"><img src="/static/newstyle/img/tixian.png" alt=""><span>提现</span></div></a></div></div><div class="moneybox"><div class="sbg"><img src="/static/newstyle/img/qianbao.png" alt=""></div><div class="top"><img src="/static/newstyle/img/qianbao.png" alt=""><span>现金钱包</span></div><div class="bottom"><span><?php echo htmlentities($user['money']); ?></span><span>=  <?php echo htmlentities($user['money']); ?></span></div></div><!--            <div class="moneybox">--><!--    <div class="sbg">--><!--        <img src="/static/newstyle/img/qianbao.png" alt="">--><!--    </div>--><!--    <div class="top">--><!--        <img src="/static/newstyle/img/qianbao.png" alt="">--><!--        <span>推荐奖励</span>--><!--    </div>--><!--    <div class="bottom">--><!--        <span> 0.00</span>--><!--        <span>=  0.00</span>--><!--    </div>--><!--</div>--></div><div class="tabbar"><li><a href="/index/index/home"><p><img src="/static/newstyle/img/home.png" alt="" class="oneimg"></p><p class="one">行情</p></a></li><li><a href="/index/user/wallet"><p><img src="/static/newstyle/img/shopping.png" alt="" class="twoimg"></p><p class="two">资产</p></a></li><li><a href="/index/user/hold"><p><img src="/static/newstyle/img/money.png" alt="" class="threeimg"></p><p class="three">交易订单</p></a></li><li><a href="https://line.me/R/ti/p/@675uflwe"><p><img src="/static/newstyle/img/wallet.png" alt="" class="fourimg"></p><p class="four">客服</p></a></li><li><a href="/index/user/index"><p><img src="/static/newstyle/img/receipt.png" alt="" class="fiveimg"></p><p class="five">我的</p></a></li></div><script type="text/javascript" src="/static/wap/js/jquery-1.9.1.min.js"></script><script type="text/javascript">
            $(function() {
                var nav = "wallet";
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
        </script><script src="/static/newstyle/js/jquery-1.9.1.min.js"></script><script></script></body></html>
