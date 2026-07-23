<?php /*a:3:{s:76:"D:\phpstudy_pro\WWW\test.ymkuzhan.com\application\index\view\user\index.html";i:1707205651;s:79:"D:\phpstudy_pro\WWW\test.ymkuzhan.com\application\index\view\public\header.html";i:1707161130;s:79:"D:\phpstudy_pro\WWW\test.ymkuzhan.com\application\index\view\public\footer.html";i:1707160183;}*/ ?>
<!DOCTYPE html><html lang="en"><!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no" name="viewport"><meta content="yes" name="apple-mobile-web-app-capable"><meta content="black" name="apple-mobile-web-app-status-bar-style"><meta content="telephone=no" name="format-detection"><meta content="email=no" name="format-detection"><title>我的</title><style type="text/css">
        html {
            font-size: 35px;
        }
    </style><link rel="stylesheet" type="text/css" href="/static/newstyle/css/common.css"></head><body><link rel="stylesheet" type="text/css" href="/static/newstyle/css/my.css"><body><div class="app"><div class="top"><a href="/index/user/msg.html"><div class="notice"><img src="/static/newstyle/img/xiaoxi.png" alt=""><div class="dian"></div></div></a></div><div class="header" style="height:7rem"><div class="left" style="margin-top:1rem"><img src="/4.png" style="height:98px;width:98px;margin-left:-8px;margin-top:-8px"></div><div class="right"><p style="font-size:16px"><?php echo htmlentities($user['phone']); ?></p><p style="font-size:16px">总余额：<?php echo htmlentities($user['money']); ?></p><p style="font-size:16px">ID:<?php echo htmlentities($user['id']); ?></p><p><img src="/static/newstyle/img/vip.png" alt="VIP1"></p></div></div><div class="btns"><a href="/index/user/recharge.html"><div class="sbtn btn1"><img src="/static/newstyle/img/cztx.png" alt=""><span>充值</span></div></a><a href="/index/user/cash.html"><div class="sbtn btn2"><img src="/static/newstyle/img/tixian.png" alt=""><span>提现</span></div></a></div></div><div class="listbox"><a class="item" href="/index/user/cash_record.html"><div><img src="/static/newstyle/img/list.png" alt=""><span>提现记录</span></div><img src="/static/newstyle/img/you.png" alt=""></a><a class="item" href="/index/user/recharge_record.html"><div><img src="/static/newstyle/img/list.png" alt=""><span>充值记录</span></div><img src="/static/newstyle/img/you.png" alt=""></a><a class="item" href="/index/user/bank_card.html"><div><img src="/static/newstyle/img/zffs.png" alt=""><span>支付方式</span></div><img src="/static/newstyle/img/you.png" alt=""></a><a class="item" href="/index/user/recommend.html"><div><img src="/static/newstyle/img/tghb.png" alt=""><span>推广分享海报</span></div><img src="/static/newstyle/img/you.png" alt=""></a><a class="item" href="/index/index/notice.html"><div><img src="/static/newstyle/img/ptgg.png" alt=""><span>平台公告</span></div><img src="/static/newstyle/img/you.png" alt=""></a><a class="item" href="/index/user/logout"><div><img src="/static/newstyle/img/ptgg.png" alt=""><span>退出登录</span></div><img src="/static/newstyle/img/you.png" alt=""></a></div><!-- tabbar --><div class="tabbar"><li><a href="/index/index/home"><p><img src="/static/newstyle/img/home.png" alt="" class="oneimg"></p><p class="one">行情</p></a></li><li><a href="/index/user/wallet"><p><img src="/static/newstyle/img/shopping.png" alt="" class="twoimg"></p><p class="two">资产</p></a></li><li><a href="/index/user/hold"><p><img src="/static/newstyle/img/money.png" alt="" class="threeimg"></p><p class="three">交易订单</p></a></li><li><a href="https://line.me/R/ti/p/@675uflwe"><p><img src="/static/newstyle/img/wallet.png" alt="" class="fourimg"></p><p class="four">客服</p></a></li><li><a href="/index/user/index"><p><img src="/static/newstyle/img/receipt.png" alt="" class="fiveimg"></p><p class="five">我的</p></a></li></div><script type="text/javascript" src="/static/newstyle/js/jquery-1.9.1.min.js"></script><script type="text/javascript">
            $(function() {
              var nav = "user";
              
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
				</script><!--<script src="/static/newstyle/js/jquery-1.9.1.min.js"></script>--><!--<script>--><!--</script>--></body></html>
