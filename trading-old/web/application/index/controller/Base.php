<?php

namespace app\index\controller;

use library\Controller;
use think\facade\Session;
use think\Db;

class Base extends Controller {
    public function initialize()
    {
        try {
            if (isLogin()) {
                $uid = Session::get('uid');
                Db::table('lc_user')->where('id', $uid)->limit(1)->update(['access_time' => time()]);
            }
        } catch (\Exception $e) {
            die('error');
        }
    }
}