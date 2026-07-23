<?php /*a:3:{s:64:"/www/wwwroot/djpqa.cn/application/index/view/user/bank_card.html";i:1641400075;s:63:"/www/wwwroot/djpqa.cn/application/index/view/public/header.html";i:1688203607;s:63:"/www/wwwroot/djpqa.cn/application/index/view/public/footer.html";i:1688192629;}*/ ?>
<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no" name="viewport"><meta content="yes" name="apple-mobile-web-app-capable"><meta content="black" name="apple-mobile-web-app-status-bar-style"><meta content="telephone=no" name="format-detection"><meta content="email=no" name="format-detection"><title>-</title><style type="text/css">
        html {
            font-size: 35px;
        }
    </style><link rel="stylesheet" type="text/css" href="/static/wap/css/common.css"><script>//LA.init({id: "JSsCh8pz2CqOvtAi",ck: "JSsCh8pz2CqOvtAi"})</script><script type="text/javascript" src="/bignumber.min.js"></script></head><body><link rel="stylesheet" type="text/css" href="/static/wap/css/box_pay.css"><div id="app"><div class="box"><div class="jun-content"><div class="f_box_bank"><div class="t_header"><span><img src="/static/wap/images/goback.png" alt="" onClick="javascript:history.back()"></span><span><i>银行卡管理</i></span></div><div class="f_content"><?php if($bank): if(is_array($bank) || $bank instanceof \think\Collection || $bank instanceof \think\Paginator): $i = 0; $__LIST__ = $bank;if( count($__LIST__)==0 ) : echo "" ;else: foreach($__LIST__ as $key=>$b): $mod = ($i % 2 );++$i;?><ul class="f_withdraw"><li class="banklist"><span><img src="/static/wap/images/gb11.png" style="height:30px; position:relative; padding: 10px;" alt=""></span><span><?php echo htmlentities($b['bank']); ?> ****<?php echo substr($b['account'], strlen($b['account']) - 4, 4); ?></span><span><?php echo htmlentities($b['name']); ?></span><i data-myid="<?php echo htmlentities($b['id']); ?>" class="awesome"></i></li></ul><?php endforeach; endif; else: echo "" ;endif; ?><div class="addbank"><a href="<?php echo getInfo('service'); ?>" class="el-button el-button--danger" id="l_addBankBtn">                            修改银行卡请联系在线客服
                        </a></div><?php else: ?><div class="addbank"><a href="/index/user/add_card" class=""><button type="button" class="el-button el-button--danger" id="l_addBankBtn"><span>绑定银行卡</span></button></a></div><?php endif; ?></div></div></div><div class="footer"><div><a href="/index/index/home" class="t_span one"><i></i><span>首页</span></a></div><!--<div><a href="/index/user/recharge" class="t_span two"><i></i><span>充值</span></a></div>--><div><a href="/index/user/hold" class="t_span two"><i></i><span>持仓</span></a></div><div><a onclick="window.open('<?php echo getInfo('service'); ?>',);" class="t_span three"><i></i><span>客服</span></a></div><!--<div><a href="/index/user/yeb" class="t_span four"><i></i><span>利息宝</span></a></div>--><div><a href="/index/user/index" class="t_span five"><i></i><span>我的</span></a></div></div><script type="text/javascript" src="/static/wap/js/jquery-1.9.1.min.js"></script><script type="text/javascript">
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