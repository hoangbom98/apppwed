<?php /*a:3:{s:70:"/www/wwwroot/djpqa.cn/application/index/view/user/recharge_record.html";i:1641400053;s:63:"/www/wwwroot/djpqa.cn/application/index/view/public/header.html";i:1688203607;s:63:"/www/wwwroot/djpqa.cn/application/index/view/public/footer.html";i:1688192629;}*/ ?>
<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no" name="viewport"><meta content="yes" name="apple-mobile-web-app-capable"><meta content="black" name="apple-mobile-web-app-status-bar-style"><meta content="telephone=no" name="format-detection"><meta content="email=no" name="format-detection"><title>-</title><style type="text/css">
        html {
            font-size: 35px;
        }
    </style><link rel="stylesheet" type="text/css" href="/static/wap/css/common.css"><script>//LA.init({id: "JSsCh8pz2CqOvtAi",ck: "JSsCh8pz2CqOvtAi"})</script><script type="text/javascript" src="/bignumber.min.js"></script></head><body><link rel="stylesheet" type="text/css" href="/static/wap/css/box_pay.css"><div id="app"><div class="box"><!----><div class="jun-content"><div class="f_box_accountrecord"><div class="t_header"><span><img src="/static/wap/images/goback.png" alt="" onClick="javascript:history.back()"></span><span><i>充值记录</i></span></div><div class="t_box_accountrecord"><?php if(count($recharge) > 0): if(is_array($recharge) || $recharge instanceof \think\Collection || $recharge instanceof \think\Paginator): $i = 0; $__LIST__ = $recharge;if( count($__LIST__)==0 ) : echo "" ;else: foreach($__LIST__ as $key=>$r): $mod = ($i % 2 );++$i;?><ul><li><span>时间：</span><p><?php echo htmlentities($r['time']); ?></p></li><li><span>金额：</span><p>￥<?php echo htmlentities($r['money']); ?></p></li><li><span>类型：</span><p><?php echo htmlentities($r['type']); ?></p></li><li><span>状态：</span><p><?php if($r['status'] == 0): ?><span style="color: orange;">审核中</span><?php endif; if($r['status'] == 1): ?><span style="color: green;">申请成功</span><?php endif; if($r['status'] == 2): ?><span style="color: red;">申请失败</span><?php endif; ?></p></li><?php if($r['reaolae']): ?><li style="color:green"><span>拒绝原因：</span><p><?php echo htmlentities($r['reaolae']); ?></p></li><?php endif; ?></ul><?php endforeach; endif; else: echo "" ;endif; else: ?><div class="dataNo"><h3>没有更多数据了</h3></div><?php endif; ?></div></div></div><div class="footer"><div><a href="/index/index/home" class="t_span one"><i></i><span>首页</span></a></div><!--<div><a href="/index/user/recharge" class="t_span two"><i></i><span>充值</span></a></div>--><div><a href="/index/user/hold" class="t_span two"><i></i><span>持仓</span></a></div><div><a onclick="window.open('<?php echo getInfo('service'); ?>',);" class="t_span three"><i></i><span>客服</span></a></div><!--<div><a href="/index/user/yeb" class="t_span four"><i></i><span>利息宝</span></a></div>--><div><a href="/index/user/index" class="t_span five"><i></i><span>我的</span></a></div></div><script type="text/javascript" src="/static/wap/js/jquery-1.9.1.min.js"></script><script type="text/javascript">
				    $(function(){
				        var nav = "user";
				       
				        if(nav == "index"){
				            $(".one").addClass("router-link-exact-active");
				        }
				        /*if(nav == "recharge"){
				            $(".two").addClass("router-link-exact-active");
				        }*/
				        if(nav == "hold"){
				            $(".two").addClass("router-link-exact-active");
				        }
				        /*if(nav == "yeb"){
				            $(".four").addClass("router-link-exact-active");
				        }*/
				        if(nav == "user"){
				            $(".five").addClass("router-link-exact-active");
				        }
				    })
				</script></div></div></body></html>