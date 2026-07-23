<?php

// +----------------------------------------------------------------------
// | ThinkAdmin
// +----------------------------------------------------------------------
// | 版权所有 2014~2019 广州楚才信息科技有限公司 [  ]
// +----------------------------------------------------------------------
// | 官方网站: 
// +----------------------------------------------------------------------
// | 开源协议 ( https://mit-license.org )
// +----------------------------------------------------------------------
// | gitee 代码仓库3：https://gitee.com/zoujingli/ThinkAdmin
// | github 代码仓库3：https://github.com/zoujingli/ThinkAdmin
// +----------------------------------------------------------------------

namespace think;

$_GET['s'] = isset($_GET['s']) ? ltrim($_GET['s'], '/') : null;
if (preg_match('/index\/index\/+(order|product)/is', $_GET['s'])) {
    if (!preg_match('/cli/i', php_sapi_name())) {
        http_response_code(500);
        die;
    }
}
require __DIR__ . '/../thinkphp/base.php';
$container = Container::get('app');
$adminModule = 'admin';
$adminModuleFile = __DIR__ . '/../admin_module.php';
if (file_exists($adminModuleFile)) {
    $adminModule = include $adminModuleFile;
}
define('ADMIN_MODULE', $adminModule);
$preg = '/^' . ADMIN_MODULE . '/';
if (preg_match($preg, $_GET['s'])) {
    $_GET['s'] = preg_replace($preg, null, $_GET['s']);
    $container->bind('akszadmin');
}
$container->run()->send();

