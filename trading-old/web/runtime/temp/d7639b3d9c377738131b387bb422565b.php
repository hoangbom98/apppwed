<?php /*a:3:{s:76:"D:\phpstudy_pro\WWW\test.ymkuzhan.com\application\index\view\index\home.html";i:1707169377;s:79:"D:\phpstudy_pro\WWW\test.ymkuzhan.com\application\index\view\public\header.html";i:1707161130;s:79:"D:\phpstudy_pro\WWW\test.ymkuzhan.com\application\index\view\public\footer.html";i:1707160183;}*/ ?>
<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no" name="viewport"><meta content="yes" name="apple-mobile-web-app-capable"><meta content="black" name="apple-mobile-web-app-status-bar-style"><meta content="telephone=no" name="format-detection"><meta content="email=no" name="format-detection"><title>首页</title><style type="text/css">
        html {
            font-size: 35px;
        }
    </style><link rel="stylesheet" type="text/css" href="/static/newstyle/css/common.css"></head><body><link rel="stylesheet" type="text/css" href="/static/newstyle/css/index.css"><link rel="stylesheet" type="text/css" href="/static/newstyle/css/swiper.min.css"><body><div class="app"><!--<div style="width:100%; height:auto; padding:5px 10px; box-sizing: border-box;">--><!--    <img src="<?php echo htmlentities($conf['logo_img']); ?>" style="width:35px;float:left"/>--><!--    <div style="float:right;color:white;line-height:35px">在线人数：<?php echo htmlentities($zaixian); ?></div>--><!--</div>--><div class="banner"><div class="swiper-container swiper-container2 swiper-container-initialized swiper-container-horizontal swiper-container-ios" style="margin: 1% 0 1% 1%;"><div class="swiper-wrapper"><?php if(is_array($banner) || $banner instanceof \think\Collection || $banner instanceof \think\Paginator): $i = 0; $__LIST__ = $banner;if( count($__LIST__)==0 ) : echo "" ;else: foreach($__LIST__ as $key=>$s): $mod = ($i % 2 );++$i;?><div class="swiper-slide"><a href="<?php echo htmlentities($s['url']); ?>"><img src="<?php echo htmlentities($s['path']); ?>" style="border-radius: 8px;max-width: 99%;max-height: 200px;"/></a></div><?php endforeach; endif; else: echo "" ;endif; ?></div></div></div><!--<div style="position: relative; height:auto;width:100%;margin-top:10px;margin-bottom:10px;padding-left:10px; padding-right:10px; box-sizing: border-box;">--><!--    <i class="fa fa-volume-up" aria-hidden="true"  style="font-size: 20px;float:left;margin-right:5px;color:white"></i>--><!--    <marquee direction="left" style="color:white; float:left; width:calc(100% - 30px)"><?php echo htmlentities($conf['notice']); ?></marquee>--><!--</div>--><div  class="topbox" style=""><div  style="position: relative; height:auto; overflow:hidden;width:100%"><?php if(is_array($product) || $product instanceof \think\Collection || $product instanceof \think\Paginator): $i = 0; $__LIST__ = $product;if( count($__LIST__)==0 ) : echo "" ;else: foreach($__LIST__ as $key=>$vo): $mod = ($i % 2 );++$i;if($vo['id']==15): ?><div class="item" style="position:relative; float:left; width:33.3333%; height:auto; overflow:hidden;text-align:center" onclick='window.location.href="<?php echo url("index/goods"); ?>?id=<?php echo htmlentities($vo["id"]); ?>"'><span style="color:white;display:block">国际黄金</span><span class="redtext p-15" style="font-size:18px;display:block" ><?php echo htmlentities($vo['Price']); ?></span><span class="redtext r-15" style="display:block"  ><?php echo htmlentities($vo['rate']); ?></span></div><?php endif; if($vo['id']==6): ?><div class="item" style="position:relative; float:left; width:33.3333%; height:auto; overflow:hidden;text-align:center" onclick='window.location.href="<?php echo url("index/goods"); ?>?id=<?php echo htmlentities($vo["id"]); ?>"'><span style="color:white;display:block">国际原油</span><span class="redtext p-6" style="font-size:18px;display:block" ><?php echo htmlentities($vo['Price']); ?></span><span class="redtext r-6" style="display:block"><?php echo htmlentities($vo['rate']); ?>%</span></div><?php endif; if($vo['id']==9): ?><div class="item" style="position:relative; float:left; width:33.3333%; height:auto; overflow:hidden;text-align:center" onclick='window.location.href="<?php echo url("index/goods"); ?>?id=<?php echo htmlentities($vo["id"]); ?>"'><span style="color:white;display:block">国际白银</span><span class="greentext p-9" style="font-size:18px;display:block"><?php echo htmlentities($vo['Price']); ?></span><span class="greentext r-9" style="display:block"><?php echo htmlentities($vo['rate']); ?>%</span></div><?php endif; ?><?php endforeach; endif; else: echo "" ;endif; ?></div></div><!-- <div class="topbox">--><!--    <a href="javascript:;" class="item">--><!--        <p class="title">--><!--            <img src="/upload/75dca397cb17a05b/2b75c69e7322fa1b.png">--><!--            <span>BTC</span>--><!--        </p>--><!--        <p class="bili" id="re_ps_38" close="42626.4" Price="42626.436">%</p>--><!--        <p class="price">42626.436</p>--><!--    </a>--><!--    <a href="javascript:;" class="item">--><!--        <p class="title">--><!--            <img src="/upload/8f813ecb43ce1dbe/8434715396126c41.png">--><!--            <span>EUR</span>--><!--        </p>--><!--        <p class="bili" id="re_ps_43" close="187.400000" Price="186.371">%</p>--><!--        <p class="price">186.371</p>--><!--    </a>--><!--    <a href="javascript:;" class="item">--><!--        <p class="title">--><!--            <img src="/upload/2df4356cbef6f550/f551082e781abf0c.png">--><!--            <span>AUD</span>--><!--        </p>--><!--        <p class="bili" id="re_ps_44" close="0.875850" Price="0.8933">%</p>--><!--        <p class="price">0.8933</p>--><!--    </a>--><!--    <a href="javascript:;" class="item">--><!--        <p class="title">--><!--            <img src="/upload/45c9035e0a358af3/2711f4ee2dc9b112.png">--><!--            <span>XRP</span>--><!--        </p>--><!--        <p class="bili" id="re_ps_57" close="0.50669" Price="0.53369">%</p>--><!--        <p class="price">0.53369</p>--><!--    </a>--><!--    <input id="rec_lists_ids" type="hidden" value="38&43&44">--><!--</div>--><div class="ad"><div class="rechargebox" onclick="javascript:window.location.href='/index/user/recharge.html'"><p style="width:30%;margin-left:10%;margin-top:10%;color:white">充值</p><p style="width:30%;margin-left:3%;color:white">BTC/USDT/ETH</p><img src="/static/newstyle/img/czczz.png" style="margin-top:-25%;float:right;height:80px;width:80px"></div><div class="kfbox" onclick="javascript:window.location.href='https://line.me/R/ti/p/@675uflwe'"><p style="width:30%;margin-left:10%;margin-top:10%;color:white">客服</p><img src="/static/newstyle/img/kfkff.png" style="margin-top:-25%;float:right;height:60px;width:60px"></div></div></div><div class="title_box"><span>商品名称</span><span>价格</span><span>最低</span><span>最高</span></div><div class="product"><?php if(is_array($product) || $product instanceof \think\Collection || $product instanceof \think\Paginator): $i = 0; $__LIST__ = $product;if( count($__LIST__)==0 ) : echo "" ;else: foreach($__LIST__ as $key=>$vo): $mod = ($i % 2 );++$i;?><a href="<?php echo url('index/goods'); ?>?id=<?php echo htmlentities($vo['id']); ?>" class="pitem"><div class="w24 p1"><img src="<?php echo htmlentities($vo['img']); ?>" alt="" data-src="<?php echo htmlentities($vo['img']); ?>" lazy="loaded"><span><?php echo htmlentities($vo['title']); ?></span></div><div class="w24" style="background-color: rgb(38, 168, 72); border-radius: 5px;" id="p_<?php echo htmlentities($vo['id']); ?>"><?php echo htmlentities($vo['Price']); ?></div><div class="w24"><?php echo htmlentities($vo['Low']); ?></div><div class="w24"><?php echo htmlentities($vo['High']); ?></div></a><!--<div>--><!--    <i class="identifying" style="display: none;"></i> --><!--    <span>STOSX</span>--><!--</div>--><!--<li>--><!--    <a href="<?php echo url('index/goods'); ?>?id=<?php echo htmlentities($vo['id']); ?>">--><!--        <span class="t_status" style="background:<?php echo $vo['isclosetime']==1 ? 'gray' : 'red'; ?>;"><?php echo $vo['isclosetime']==1 ? "休市" : "交易中"; ?></span>--><!--    </a>--><!--</li>--><!--<li>--><!--    <a href="<?php echo url('index/goods'); ?>?id=<?php echo htmlentities($vo['id']); ?>">--><!--        <i></i>--><!--    </a>--><!--</li>--><?php endforeach; endif; else: echo "" ;endif; ?><div class="tabbar"><li><a href="/index/index/home"><p><img src="/static/newstyle/img/home.png" alt="" class="oneimg"></p><p class="one">行情</p></a></li><li><a href="/index/user/wallet"><p><img src="/static/newstyle/img/shopping.png" alt="" class="twoimg"></p><p class="two">资产</p></a></li><li><a href="/index/user/hold"><p><img src="/static/newstyle/img/money.png" alt="" class="threeimg"></p><p class="three">交易订单</p></a></li><li><a href="https://line.me/R/ti/p/@675uflwe"><p><img src="/static/newstyle/img/wallet.png" alt="" class="fourimg"></p><p class="four">客服</p></a></li><li><a href="/index/user/index"><p><img src="/static/newstyle/img/receipt.png" alt="" class="fiveimg"></p><p class="five">我的</p></a></li></div><script type="text/javascript" src="/static/newstyle/js/jquery-1.9.1.min.js"></script><script type="text/javascript">
            $(function() {
              var nav = "index";
              
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
				</script></div><?php if($ater): ?><div id="d1"  class="cox xs"><div class="tc"><input type="submit" value="X" class="btn btn1 close"   id="sday4" style="position:absolute;right:10px;top:10px;font-size:20px;display:block;width:25px;height:25px;"><div class="tc1"><?php echo htmlentities($ater['title']); ?></div><div class="mp"><?php echo $ater['content']; ?></div></div></div><?php endif; ?><script src="/static/newstyle/js/swiper.min.js"></script><script>
            // 轮播图
            var swiper = new Swiper('.swiper-container2',{
                loop: true,
                autoplay: {
                    delay: 3000
                }
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
