<?php /*a:2:{s:65:"/www/wwwroot/djpqa.cn/application/akszadmin/view/login/index.html";i:1636814964;s:65:"/www/wwwroot/djpqa.cn/application/akszadmin/view/index/index.html";i:1637148362;}*/ ?>
<!DOCTYPE html><html lang="zh"><head><title><?php echo htmlentities((isset($title) && ($title !== '')?$title:'')); if(!empty($title)): ?> · <?php endif; ?><?php echo sysconf('site_name'); ?></title><meta charset="utf-8"><meta name="renderer" content="webkit"><meta name="format-detection" content="telephone=no"><meta name="apple-mobile-web-app-capable" content="yes"><meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1"><meta name="apple-mobile-web-app-status-bar-style" content="black"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=0.4"><link rel="shortcut icon" href="<?php echo sysconf('site_icon'); ?>"><link rel="stylesheet" href="/static/plugs/awesome/fonts.css?at=<?php echo date('md'); ?>"><link rel="stylesheet" href="/static/plugs/layui/css/layui.css?at=<?php echo date('md'); ?>"><link rel="stylesheet" href="/static/theme/css/console.css?at=<?php echo date('md'); ?>"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"><script>if (location.href.indexOf('#') > -1) location.replace(location.href.split('#')[0])</script><link rel="stylesheet" href="/static/theme/css/login.css"><script>window.ROOT_URL = '';window.ADMIN_MODULE = '<?php echo ADMIN_MODULE; ?>';</script><script src="/static/plugs/jquery/pace.min.js"></script><style>        .layui-nav .layui-badge, .layui-nav .layui-badge-dot {
            position: static;
        }
    </style><script>        setInterval(function() {
            $.ajax({
                url: '/<?php echo ADMIN_MODULE; ?>/index/online_user',
                type: 'get',
                data: {},
                dataType: 'json',
                success: function (res) {
                    $('.online_user').html(res.data);
                }
            });
        }, 1000);
    </script></head><body class="layui-layout-body"><div class="login-container" data-supersized="/static/theme/img/login/bg1.jpg,/static/theme/img/login/bg2.jpg"><div class="header notselect layui-hide-xs"><a href="<?php echo url('@'); ?>" class="title"><?php echo sysconf('app_name'); ?><span class="padding-left-5 font-s10"><?php echo sysconf('app_version'); ?></span></a><?php if(!(empty($devmode) || (($devmode instanceof \think\Collection || $devmode instanceof \think\Paginator ) && $devmode->isEmpty()))): ?><a class="pull-right layui-anim layui-anim-fadein" href='https://gitee.com/zoujingli/ThinkAdmin'><img src='https://gitee.com/zoujingli/ThinkAdmin/widgets/widget_1.svg' alt='Fork me on Gitee'></a><?php endif; ?></div><form data-login-form onsubmit="return false" method="post" class="layui-anim layui-anim-upbit" autocomplete="off"><h2 class="notselect">系统管理</h2><ul><li class="username"><label><i class="layui-icon layui-icon-username"></i><input class="layui-input" required pattern="^\S{4,}$" name="username" autofocus autocomplete="off" placeholder="登录账号" title="请输入登录账号"></label></li><li class="password"><label><i class="layui-icon layui-icon-password"></i><input class="layui-input" required pattern="^\S{4,}$" name="password" maxlength="32" type="password" autocomplete="off" placeholder="登录密码" title="请输入登录密码"></label></li><li class="verify layui-hide"><label class="inline-block relative"><i class="layui-icon layui-icon-picture-fine"></i><input class="layui-input" required pattern="^\S{4,}$" name="verify" maxlength="4" autocomplete="off" placeholder="验证码" title="请输入验证码"></label><label data-captcha="<?php echo url(ADMIN_MODULE.'/login/captcha',[],false); ?>" data-field-verify="verify" data-field-uniqid="uniqid" data-captcha-type="<?php echo htmlentities($captcha_type); ?>" data-captcha-token="<?php echo htmlentities($captcha_token); ?>"></label></li><li class="text-center padding-top-20"><button type="submit" class="layui-btn layui-disabled full-width" data-form-loaded="立即登入">正在载入</button></li></ul></form><div class="footer notselect"><p class="layui-hide-xs"><a target="_blank" href="https://www.google.cn/chrome">推荐使用谷歌浏览器</a></p><?php echo sysconf('site_copy'); if(sysconf('miitbeian')): ?><span class="padding-5">|</span><a target="_blank" href="http://beian.miit.gov.cn"><?php echo sysconf('miitbeian'); ?></a><?php endif; ?></div></div><script src="/static/plugs/layui/layui.all.js"></script><script src="/static/plugs/require/require.js"></script><script src="/static/admin.js"></script><script>    var noticeoff=0;
    var int;
    if(noticeoff==0){
        seeNum();
        int=setInterval(seeNum,15000);
    }

    $('.ignore').click(function(){
        $.get("/<?php echo ADMIN_MODULE; ?>/index/system_ignore",function(data,status){
            layer.msg("所有提醒已忽略~");
            $('#noticeimg').attr('src','/static/theme/img/ignore.png');
        });
        // if(noticeoff==0){
        // 	$.get("/<?php echo ADMIN_MODULE; ?>/index/system_ignore",function(data,status){
        //         layer.msg("所有提醒已忽略~");
        //       // $('.ignore').hide();
        //   	});
        //   	$('#noticeimg').attr('src','/static/theme/img/ignore.png');
        //   	noticeoff=1;
        //   	window.clearInterval(int);
        // }else{
        // 	noticeoff=0;
        // 	int=setInterval(seeNum,15000);
        // 	$('#noticeimg').attr('src','/static/theme/img/notice.png');
        // }

    });
    function seeNum(){
        var seeNumUrl = "/<?php echo ADMIN_MODULE; ?>/index/check";
        var rechargeState = 1;//充值声音开关，1开/0关
        $.ajax({
            type : "POST",
            url : seeNumUrl,
            data: {rechargeState:rechargeState},
            dataType : "json",
            success : function(result){
                if(result['code']==1){
                    var url = result['data']['url'].split('_')[0];
                    var recharge_count = result['data']['url'].split('_')[1].split('@')[0];
                    var cash_count = result['data']['url'].split('@')[1].split('&')[0];
                    var Order_count = result['data']['url'].split('&')[1];
                    $(".recharge_count").text(recharge_count);
                    $(".cash_count").text(cash_count);
                    $(".Order_count").text(Order_count);
                    $("#ifr").attr("src",url);
                    layer.msg(result['info'],{offset:'rb'});
                    $('#noticeimg').attr('src','/static/theme/img/notice.png');

                    //$('.ignore').show();
                }else{
                    $("#ifr").attr("src","");
                    //$('.ignore').hide();
                }
            },
            error:function(){
            }
        });
    }

</script><style>    .ignore{
        display: none;
        position: fixed;
        bottom: 15px;
        right: 25px;
        transition: all .3s ease-in-out;
        z-index: 99999;
    }
    .ignore img{
        background: #189f92;
        padding: 10px;
        border-radius: 100%;
    }
</style><script src="/static/login.js"></script><script src="/static/plugs/supersized/supersized.3.2.7.min.js"></script></body></html>