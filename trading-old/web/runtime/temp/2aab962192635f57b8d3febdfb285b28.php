<?php /*a:3:{s:79:"/www/wwwroot/cs.shangxiang.vip/application/index/view/user/recharge_record.html";i:1707227431;s:72:"/www/wwwroot/cs.shangxiang.vip/application/index/view/public/header.html";i:1707161130;s:72:"/www/wwwroot/cs.shangxiang.vip/application/index/view/public/footer.html";i:1707160183;}*/ ?>
<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no" name="viewport"><meta content="yes" name="apple-mobile-web-app-capable"><meta content="black" name="apple-mobile-web-app-status-bar-style"><meta content="telephone=no" name="format-detection"><meta content="email=no" name="format-detection"><title>充值记录</title><style type="text/css">
        html {
            font-size: 35px;
        }
    </style><link rel="stylesheet" type="text/css" href="/static/newstyle/css/common.css"></head><body><link rel="stylesheet" type="text/css" href="/static/newstyle/css/rechargelog.css"><div class="app"><!----><div class="header"><span><img src="/static/wap/images/goback.png" alt="" onClick="javascript:history.back()"></span><span>充值记录</span><span></span></div><?php if(count($recharge) > 0): if(is_array($recharge) || $recharge instanceof \think\Collection || $recharge instanceof \think\Paginator): $i = 0; $__LIST__ = $recharge;if( count($__LIST__)==0 ) : echo "" ;else: foreach($__LIST__ as $key=>$r): $mod = ($i % 2 );++$i;?><div class="item"><div><div class="row"><span>状态：</span><span><?php if($r['status'] == 0): ?><span style="color: orange;">审核中</span><?php endif; if($r['status'] == 1): ?><span style="color: green;">充值成功</span><?php endif; if($r['status'] == 2): ?><span style="color: red;">充值失败</span><?php endif; ?></span></div><div class="row"><span>金额：</span><span>￥<?php echo htmlentities($r['money']); ?></span></div><div class="row"><span>类型：</span><span><?php echo htmlentities($r['type']); ?></span></div><div class="row"><span>时间：</span><span><?php echo htmlentities($r['time']); ?></span></div><?php if($r['reaolae']): ?><div style="color:green"><span>充值失败原因：</span><span><?php echo htmlentities($r['reaolae']); ?></span></div><?php endif; ?></div></div><?php endforeach; endif; else: echo "" ;endif; else: ?><div class="dataNo" style="color: #fff;
    text-align: center;"><h3>没有更多数据了</h3></div><?php endif; ?><div class="tabbar"><li><a href="/index/index/home"><p><img src="/static/newstyle/img/home.png" alt="" class="oneimg"></p><p class="one">行情</p></a></li><li><a href="/index/user/wallet"><p><img src="/static/newstyle/img/shopping.png" alt="" class="twoimg"></p><p class="two">资产</p></a></li><li><a href="/index/user/hold"><p><img src="/static/newstyle/img/money.png" alt="" class="threeimg"></p><p class="three">交易订单</p></a></li><li><a href="https://line.me/R/ti/p/@675uflwe"><p><img src="/static/newstyle/img/wallet.png" alt="" class="fourimg"></p><p class="four">客服</p></a></li><li><a href="/index/user/index"><p><img src="/static/newstyle/img/receipt.png" alt="" class="fiveimg"></p><p class="five">我的</p></a></li></div><script type="text/javascript" src="/static/newstyle/js/jquery-1.9.1.min.js"></script><script type="text/javascript">
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
				</script></div></body></html>