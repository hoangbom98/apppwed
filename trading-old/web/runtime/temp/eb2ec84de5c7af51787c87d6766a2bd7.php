<?php /*a:1:{s:74:"/www/wwwroot/cs.shangxiang.vip/application/akszadmin/view/index/index.html";i:1637148362;}*/ ?>
<!DOCTYPE html><html lang="zh"><head><title><?php echo htmlentities((isset($title) && ($title !== '')?$title:'')); if(!empty($title)): ?> · <?php endif; ?><?php echo sysconf('site_name'); ?></title><meta charset="utf-8"><meta name="renderer" content="webkit"><meta name="format-detection" content="telephone=no"><meta name="apple-mobile-web-app-capable" content="yes"><meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1"><meta name="apple-mobile-web-app-status-bar-style" content="black"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=0.4"><link rel="shortcut icon" href="<?php echo sysconf('site_icon'); ?>"><link rel="stylesheet" href="/static/plugs/awesome/fonts.css?at=<?php echo date('md'); ?>"><link rel="stylesheet" href="/static/plugs/layui/css/layui.css?at=<?php echo date('md'); ?>"><link rel="stylesheet" href="/static/theme/css/console.css?at=<?php echo date('md'); ?>"><script>window.ROOT_URL = '';window.ADMIN_MODULE = '<?php echo ADMIN_MODULE; ?>';</script><script src="/static/plugs/jquery/pace.min.js"></script><style>        .layui-nav .layui-badge, .layui-nav .layui-badge-dot {
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
    </script></head><body class="layui-layout-body"><div class="ignore" style="display:block"><img id='noticeimg' src="/static/theme/img/notice.png" width="32"></div><div class="layui-layout layui-layout-admin layui-layout-left-hide"><!-- 顶部菜单 开始 --><div class="layui-header notselect"><a href="javascript:void(0);" class="layui-logo layui-elip" style="pointer-events: none;"><?php echo sysconf('app_name'); if(sysconf('app_version')): ?><sup class="padding-left-5"><?php echo sysconf('app_version'); ?></sup><?php endif; ?></a><ul class="layui-nav layui-layout-left"><li class="layui-nav-item" lay-unselect><a class="text-center" data-target-menu-type><i class="layui-icon layui-icon-spread-left"></i></a></li><?php foreach($menus as $oneMenu): ?><li class="layui-nav-item"><a data-menu-node="m-<?php echo htmlentities($oneMenu['id']); ?>" data-open="<?php echo htmlentities($oneMenu['url']); ?>"><?php if(!(empty($oneMenu['icon']) || (($oneMenu['icon'] instanceof \think\Collection || $oneMenu['icon'] instanceof \think\Paginator ) && $oneMenu['icon']->isEmpty()))): ?><span class='<?php echo htmlentities($oneMenu['icon']); ?> padding-right-5'></span><?php endif; ?><span><?php echo htmlentities((isset($oneMenu['title']) && ($oneMenu['title'] !== '')?$oneMenu['title']:'')); ?></span></a></li><?php endforeach; ?></ul><ul class="layui-nav layui-layout-right"><li lay-unselect class="layui-nav-item"><a href="/<?php echo ADMIN_MODULE; ?>.html#/<?php echo ADMIN_MODULE; ?>/users/index.html?online_user=1">                在线人数
                <span class="layui-badge online_user">0</span></a></li>&nbsp;&nbsp;&nbsp;
            <li lay-unselect class="layui-nav-item"><a href="/<?php echo ADMIN_MODULE; ?>.html#/<?php echo ADMIN_MODULE; ?>/recharge/index.html?spm=m-69-105-107" data-reload>                充值
                <span class="layui-badge recharge_count">0</span></a></li>&nbsp;&nbsp;&nbsp;
            <li lay-unselect class="layui-nav-item"><a href="/<?php echo ADMIN_MODULE; ?>.html#/<?php echo ADMIN_MODULE; ?>/cash/index.html?spm=m-69-105-108" data-reload>                提现
                <span class="layui-badge cash_count">0</span></a></li>&nbsp;&nbsp;&nbsp;
            <li lay-unselect class="layui-nav-item"><a href="/<?php echo ADMIN_MODULE; ?>.html#/<?php echo ADMIN_MODULE; ?>/order/index.html?spm=m-109-111-116" data-reload>                订单
                <span class="layui-badge Order_count">0</span></a></li><li lay-unselect class="layui-nav-item"><a data-reload><i class="layui-icon layui-icon-refresh-3"></i></a></li><?php if(!(empty(app('session')->get('user.username')) || ((app('session')->get('user.username') instanceof \think\Collection || app('session')->get('user.username') instanceof \think\Paginator ) && app('session')->get('user.username')->isEmpty()))): ?><li class="layui-nav-item"><dl class="layui-nav-child"><dd lay-unselect><a data-modal="<?php echo url(ADMIN_MODULE.'/index/info',['id'=>session('user.id')]); ?>"><i class="layui-icon layui-icon-set-fill margin-right-5"></i>基本资料</a></dd><dd lay-unselect><a data-modal="<?php echo url(ADMIN_MODULE.'/user/pass',['id'=>session('user.id')]); ?>"><i class="layui-icon layui-icon-component margin-right-5"></i>安全设置</a></dd><dd lay-unselect><a data-modal="<?php echo url(ADMIN_MODULE.'/user/suffix',['id'=>session('user.id')]); ?>"><i class="layui-icon layui-icon-component margin-right-5"></i>后台加密</a></dd><?php if(auth('akszadmin/index/buildoptimize')): ?><dd lay-unselect><a data-modal="<?php echo url(ADMIN_MODULE.'/index/buildOptimize'); ?>"><i class="layui-icon layui-icon-template-1 margin-right-5"></i>压缩发布</a></dd><?php endif; if(auth('akszadmin/index/clearruntime')): ?><dd lay-unselect><a data-modal="<?php echo url(ADMIN_MODULE.'/index/clearRuntime'); ?>"><i class="layui-icon layui-icon-fonts-clear margin-right-5"></i>清理缓存</a></dd><?php endif; if(!(empty($GLOBALS['AdminUserRightOption']) || (($GLOBALS['AdminUserRightOption'] instanceof \think\Collection || $GLOBALS['AdminUserRightOption'] instanceof \think\Paginator ) && $GLOBALS['AdminUserRightOption']->isEmpty()))): foreach($GLOBALS['AdminUserRightOption'] as $option): if(auth($option['node'])): ?><dd lay-unselect><a data-<?php echo htmlentities($option['type']); ?>="<?php echo htmlentities($option['action']); ?>"><i class="<?php echo htmlentities($option['icon']); ?> margin-right-5"></i><?php echo htmlentities($option['title']); ?></a></dd><?php endif; ?><?php endforeach; ?><?php endif; ?><dd lay-unselect><a data-confirm="确定要退出登录吗？" data-load="<?php echo url(ADMIN_MODULE.'/login/out'); ?>"><i class="layui-icon layui-icon-release margin-right-5"></i>退出登录</a></dd></dl><a><span><i class="layui-icon layui-icon-username margin-right-5"></i><?php echo session('user.username'); ?></span></a></li><?php else: ?><li class="layui-nav-item"><a data-href="<?php echo url('@'.ADMIN_MODULE.'/login'); ?>"><i class="layui-icon layui-icon-username"></i> 立即登录</a></li><?php endif; ?></ul></div><!-- 顶部菜单 结束 --><!-- 左则菜单 开始 --><div class="layui-side layui-bg-black notselect"><div class="layui-side-scroll"><?php foreach($menus as $oneMenu): if(!(empty($oneMenu['sub']) || (($oneMenu['sub'] instanceof \think\Collection || $oneMenu['sub'] instanceof \think\Paginator ) && $oneMenu['sub']->isEmpty()))): ?><ul class="layui-nav layui-nav-tree layui-hide" data-menu-layout="m-<?php echo htmlentities($oneMenu['id']); ?>"><?php foreach($oneMenu['sub'] as $twoMenu): if(empty($twoMenu['sub']) || (($twoMenu['sub'] instanceof \think\Collection || $twoMenu['sub'] instanceof \think\Paginator ) && $twoMenu['sub']->isEmpty())): ?><li class="layui-nav-item"><a data-target-tips="<?php echo htmlentities($twoMenu['title']); ?>" data-menu-node="m-<?php echo htmlentities($oneMenu['id']); ?>-<?php echo htmlentities($twoMenu['id']); ?>" data-open="<?php echo htmlentities($twoMenu['url']); ?>"><span class='<?php echo htmlentities((isset($twoMenu['icon']) && ($twoMenu['icon'] !== '')?$twoMenu['icon']:"layui-icon layui-icon-link")); ?>'></span><span class="nav-text padding-left-5"><?php echo htmlentities($twoMenu['title']); ?></span></a></li><?php else: ?><li class="layui-nav-item" data-submenu-layout='m-<?php echo htmlentities($oneMenu['id']); ?>-<?php echo htmlentities($twoMenu['id']); ?>'><a data-target-tips="<?php echo htmlentities($twoMenu['title']); ?>" style="background:#393D49"><span class='nav-icon layui-hide <?php echo htmlentities((isset($twoMenu['icon']) && ($twoMenu['icon'] !== '')?$twoMenu['icon']:"layui-icon layui-icon-triangle-d")); ?>'></span><span class="nav-text padding-left-5"><?php echo htmlentities($twoMenu['title']); ?></span></a><dl class="layui-nav-child"><?php foreach($twoMenu['sub'] as $thrMenu): ?><dd><a data-target-tips="<?php echo htmlentities($thrMenu['title']); ?>" data-open="<?php echo htmlentities($thrMenu['url']); ?>" data-menu-node="m-<?php echo htmlentities($oneMenu['id']); ?>-<?php echo htmlentities($twoMenu['id']); ?>-<?php echo htmlentities($thrMenu['id']); ?>"><span class='nav-icon padding-left-5 <?php echo htmlentities((isset($thrMenu['icon']) && ($thrMenu['icon'] !== '')?$thrMenu['icon']:"layui-icon layui-icon-link")); ?>'></span><span class="nav-text padding-left-5"><?php echo htmlentities($thrMenu['title']); ?></span></a></dd><?php endforeach; ?></dl></li><?php endif; ?><?php endforeach; ?></ul><?php endif; ?><?php endforeach; ?></div></div><!-- 左则菜单 结束 --><!-- 主体内容 开始 --><div class="layui-body layui-bg-gray"></div><!-- 主体内容 结束 --></div><iframe style="top:100px;right:50px" src="" height="0" width="0" frameborder="0" id="ifr"></iframe><script src="/static/plugs/layui/layui.all.js"></script><script src="/static/plugs/require/require.js"></script><script src="/static/admin.js"></script><script>    var noticeoff=0;
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
</style></body></html>