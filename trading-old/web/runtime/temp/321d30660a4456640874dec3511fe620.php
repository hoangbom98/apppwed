<?php /*a:3:{s:60:"/www/wwwroot/djpqa.cn/application/index/view/index/home.html";i:1688111214;s:63:"/www/wwwroot/djpqa.cn/application/index/view/public/header.html";i:1688203607;s:63:"/www/wwwroot/djpqa.cn/application/index/view/public/footer.html";i:1688192629;}*/ ?>
<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no" name="viewport"><meta content="yes" name="apple-mobile-web-app-capable"><meta content="black" name="apple-mobile-web-app-status-bar-style"><meta content="telephone=no" name="format-detection"><meta content="email=no" name="format-detection"><title>首页</title><style type="text/css">
        html {
            font-size: 35px;
        }
    </style><link rel="stylesheet" type="text/css" href="/static/wap/css/common.css"><script>//LA.init({id: "JSsCh8pz2CqOvtAi",ck: "JSsCh8pz2CqOvtAi"})</script><script type="text/javascript" src="/bignumber.min.js"></script></head><body><link rel="stylesheet" type="text/css" href="/static/theme/index/css/swiper.min.css"/><!--<link href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" rel="stylesheet">--><link href="https://cdn.bootcdn.net/ajax/libs/font-awesome/4.7.0/css/font-awesome.css" rel="stylesheet"><style type="text/css">
    body {
        background: #110e1f;
        overflow: auto;
    }
    span {
        display: inline-block;
    }

    .ad {
        width: 100%;
        margin: 0 auto;
        font-size: 0;
    }

    .swiper-container2 .swiper-slide {
        line-height: 0;
    }

    .swiper-container2 .swiper-slide img {
        width: 100%;
    }
	#d1{
	  position:absolute;
	  top:110px;
	  left:20px;
	  background:#fff;
	  border-radius:8px;
	  padding:15px;
	  width:80%;
 
	  z-index:999999
	}
	.tc1{
	  text-align:center;
	  line-height:35px;
	  color:red;
	  font-size:30px;
	}
	.mp{
	  line-height:30px;
	  height:368px ;
	  overflow-y: scroll;
	}
	.mp img{
	    width:100%;
	}
	.redbox{
	  height:40px;
	   margin:0 auto;
	   text-align:center;
	   margin-top:8px;
	}
	.redbox .btn{
	  width:100px;
	  margin:0 auto;
	   text-align:center;
	   display:block;
	  height:35px;
	  line-height:35px;
	  color:#fff;
	   border-radius:31px;
	  background:#000
	}
	.redtext {
	    color: red;
	}
	.greentext {
	    color: green;
	}
</style><div id="app"><div style="width:100%; height:auto; padding:5px 10px; box-sizing: border-box;"><img src="<?php echo htmlentities($conf['logo_img']); ?>" style="width:35px;float:left"/><div style="float:right;color:white;line-height:35px">在线人数：<?php echo htmlentities($zaixian); ?></div></div><div class="ad"><div class="swiper-container swiper-container2" style="margin: 1% 0 1% 1%;"><div class="swiper-wrapper"><?php if(is_array($banner) || $banner instanceof \think\Collection || $banner instanceof \think\Paginator): $i = 0; $__LIST__ = $banner;if( count($__LIST__)==0 ) : echo "" ;else: foreach($__LIST__ as $key=>$s): $mod = ($i % 2 );++$i;?><div class="swiper-slide"><a href="<?php echo htmlentities($s['url']); ?>"><img src="<?php echo htmlentities($s['path']); ?>" style="border-radius: 8px;max-width: 99%;max-height: 200px;"/></a></div><?php endforeach; endif; else: echo "" ;endif; ?></div></div></div><div style="position: relative; height:auto;width:100%;margin-top:10px;margin-bottom:10px;padding-left:10px; padding-right:10px; box-sizing: border-box;"><i class="fa fa-volume-up" aria-hidden="true"  style="font-size: 20px;float:left;margin-right:5px;color:white"></i><marquee direction="left" style="color:white; float:left; width:calc(100% - 30px)"><?php echo htmlentities($conf['notice']); ?></marquee></div><div style="position: relative; height:auto;width:100%;margin-top:10px;"><div style="position: relative; height:auto; overflow:hidden;width:100%"><?php if(is_array($product) || $product instanceof \think\Collection || $product instanceof \think\Paginator): $i = 0; $__LIST__ = $product;if( count($__LIST__)==0 ) : echo "" ;else: foreach($__LIST__ as $key=>$vo): $mod = ($i % 2 );++$i;if($vo['id']==15): ?><div style="position:relative; float:left; width:33.3333%; height:auto; overflow:hidden;text-align:center" onclick='window.location.href="<?php echo url("index/goods"); ?>?id=<?php echo htmlentities($vo["id"]); ?>"'><span style="color:white;display:block">国际黄金</span><span class="redtext p-15" style="font-size:18px;display:block" ><?php echo htmlentities($vo['Price']); ?></span><span class="redtext r-15" style="display:block"  ><?php echo htmlentities($vo['rate']); ?></span></div><?php endif; if($vo['id']==6): ?><div style="position:relative; float:left; width:33.3333%; height:auto; overflow:hidden;text-align:center" onclick='window.location.href="<?php echo url("index/goods"); ?>?id=<?php echo htmlentities($vo["id"]); ?>"'><span style="color:white;display:block">国际原油</span><span class="redtext p-6" style="font-size:18px;display:block" ><?php echo htmlentities($vo['Price']); ?></span><span class="redtext r-6" style="display:block"><?php echo htmlentities($vo['rate']); ?>%</span></div><?php endif; if($vo['id']==9): ?><div style="position:relative; float:left; width:33.3333%; height:auto; overflow:hidden;text-align:center" onclick='window.location.href="<?php echo url("index/goods"); ?>?id=<?php echo htmlentities($vo["id"]); ?>"'><span style="color:white;display:block">国际白银</span><span class="greentext p-9" style="font-size:18px;display:block"><?php echo htmlentities($vo['Price']); ?></span><span class="greentext r-9" style="display:block"><?php echo htmlentities($vo['rate']); ?>%</span></div><?php endif; ?><?php endforeach; endif; else: echo "" ;endif; ?></div><div style="position: relative; height:auto; overflow:hidden;width:100%;padding-left:10px; padding-right:10px; box-sizing: border-box;margin-top:10px;"><div style="width:60%;position:relative; float:left;height:90px; overflow:hidden; background-color:#222629; border-radius:5px;padding:10px 10px; box-sizing: border-box; margin-right:10px"><a href="/index/user/recharge"><i class="fa fa-exchange" aria-hidden="true" style="position:absolute; font-size:30px; right:10px; color:white;top:30px"></i><span style="color:white;width:100%;">快捷入市</span><span style="color:rgba(255,255,255,.5)">银行卡转账和多种方<br/>式选择</span></a></div><div style="width:calc(40% - 10px);position:relative; float:left;height:40px; overflow:hidden; background-color:#222629; border-radius:5px;padding:10px 10px; box-sizing: border-box; margin-bottom:10px"><a href="/index/index/about_details?id=32"><i class="fa fa-address-card-o" aria-hidden="true" style="position:relative; color:white;font-size:17px;margin-top: 2px;float:left;margin-left:15px"></i><span style="color:white; float:left; margin-left:5px">关于我们</span></a></div><div style="width:calc(40% - 10px);position:relative; float:left;height:40px; overflow:hidden; background-color:#222629; border-radius:5px;padding:10px 10px; box-sizing: border-box; margin-bottom:10px"><a href="/index/index/about_details?id=33"><i class="fa fa-question-circle-o" aria-hidden="true" style="position:relative;color:white; font-size:20px;float:left;margin-left:15px"></i><span style="color:white; float:left; margin-left:5px">帮助中心</span></a></div></div></div><div style="color:white; padding:10px 10px; box-sizing: border-box;">涨幅榜</div><div class="box"><div class="jun-content"><div class="t_box slide"><div class="t_table"><ul class="t_lineher"><li>热门产品</li><li>最新</li><li>状态</li></ul><div class="t_con_home"><?php if(is_array($product) || $product instanceof \think\Collection || $product instanceof \think\Paginator): $i = 0; $__LIST__ = $product;if( count($__LIST__)==0 ) : echo "" ;else: foreach($__LIST__ as $key=>$vo): $mod = ($i % 2 );++$i;?><ul style="background-image: url('/static/wap/images/bg.png'); background-repeat: no-repeat;" onclick='window.location.href="<?php echo url("index/goods"); ?>?id=<?php echo htmlentities($vo["id"]); ?>"'><li><a href="<?php echo url('index/goods'); ?>?id=<?php echo htmlentities($vo['id']); ?>"><span><img src="<?php echo htmlentities($vo['img']); ?>" alt="" data-src="<?php echo htmlentities($vo['img']); ?>" lazy="loaded"></span></a><div><i class="identifying" style="display: none;"></i><span><?php echo htmlentities($vo['title']); ?></span><span>STOSX</span></div></li><li><span style="background-color: rgb(38, 168, 72);" id="p_<?php echo htmlentities($vo['id']); ?>"><?php echo htmlentities($vo['Price']); ?></span></li><li><a href="<?php echo url('index/goods'); ?>?id=<?php echo htmlentities($vo['id']); ?>"><span class="t_status" style="background:<?php echo $vo['isclosetime']==1 ? 'gray' : 'red'; ?>;"><?php echo $vo['isclosetime']==1 ? "休市" : "交易中"; ?></span></a></li><li><a href="<?php echo url('index/goods'); ?>?id=<?php echo htmlentities($vo['id']); ?>"><i></i></a></li></ul><?php endforeach; endif; else: echo "" ;endif; ?></div></div></div></div><div class="footer"><div><a href="/index/index/home" class="t_span one"><i></i><span>首页</span></a></div><!--<div><a href="/index/user/recharge" class="t_span two"><i></i><span>充值</span></a></div>--><div><a href="/index/user/hold" class="t_span two"><i></i><span>持仓</span></a></div><div><a onclick="window.open('<?php echo getInfo('service'); ?>',);" class="t_span three"><i></i><span>客服</span></a></div><!--<div><a href="/index/user/yeb" class="t_span four"><i></i><span>利息宝</span></a></div>--><div><a href="/index/user/index" class="t_span five"><i></i><span>我的</span></a></div></div><script type="text/javascript" src="/static/wap/js/jquery-1.9.1.min.js"></script><script type="text/javascript">
				    $(function(){
				        var nav = "index";
				       
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
				</script></div></div><?php if($ater): ?><div id="d1"  class="cox xs"><div class="tc"><input type="submit" value="X" class="btn btn1 close"   id="sday4" style="position:absolute;right:10px;top:10px;font-size:20px;display:block;width:25px;height:25px;"><div class="tc1"><?php echo htmlentities($ater['title']); ?></div><div class="mp"><?php echo $ater['content']; ?></div></div></div><?php endif; ?><script src="/static/theme/index/js/swiper.min.js"></script><script type="text/javascript">
        $(function () {
		    $("#sday4").click(function(){
			  $("#d1").hide();
			})
            var swiper2 = new Swiper('.swiper-container2', {
                loop: true,
                autoplay: {
                    delay: 3000
                },
                pagination: {
                    el: '.swiper-pagination',
                },
            });
        })
        function getdt() {
        	//$.get('/index/index/product');
        	//$.get('/index/index/order');
            $.get('/index/index/ajaxdata', '', function(datajson) {
                var pro = eval('(' + datajson + ')');
                $.each(pro, function(k, v) {
                    id = '#' + 'p_' + v.id;
                    pdid = '#' + 'pd_' + v.id;
                    class1 = '.' + 'p-' + v.id;
                    class2 = '.' + 'r-' + v.id;
                    $(id).html(v.Price); //全部的价格进行变动
                    $(class1).html(v.Price); 
                    $(class2).html(v.rate+'%');
                    if (v.is_rise == 2) {
                        $(id).css('background', 'rgb(255, 1, 5)');
                         $(class1).css('color', 'red');
                         $(class2).css('color', 'red');
                    } else {
                        $(id).css('background', 'rgb(38, 168, 72)');
                        $(class1).css('color', 'green');
                        $(class2).css('color', 'green');

                    }
                    
                    if(v.rate >0){
                        
                    }
                    
                    if (v.is_deal == 0) {
                        $(pdid).css('background', 'rgb(58, 142, 230)');
                        $(pdid).html("休市");
                    } else {

                        $(pdid).html("交易中");
                    }
                })
            });
        }
        getdt();
        window.setInterval("getdt()", 1000);
    </script></body></html>
