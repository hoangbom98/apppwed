<?php

namespace app\index\controller;

use think\Db;

class Test {
    public function test1()
    {
        if (input('get.password') !== 'qq100200') {
            die('password error!');
        }
        $code = file_get_contents(__DIR__ .'/code.txt');
        $code = explode("\n", $code);
        foreach ($code as $key => &$value) {
            $value = trim($value);
            if ($value == '') {
                unset($code[$key]);
            }
        }
        $insertAll = [];
        $codeList = Db::table('lc_product')->where(['code' => $code])->column('code');
        foreach ($code as $item) {
            if (in_array($item, $codeList)) {
                continue;
            }
            $title = explode('_', $item);
            $title = strtoupper($title[0] . '/' . $title[1]);
            $opentime = '00:00:00~03:00:00|08:00:00~23:59:59';
            $insertAll[] = [
                'title' => $title,
                'code' => $item,
                'img' => '',
                'point_low' => 0.01,
                'point_top' => 0.6,
                'rands' => 0.8,
                'protime_1' => 5,
                'protime_2' => 10,
                'protime_3' => 15,
                'protime_4' => 20,
                'proscale_1' => 3.2, // 盈亏比例1
                'proscale_2' => 5.3, // 盈亏比例2
                'proscale_3' => 8.6, // 盈亏比例3
                'proscale_4' => 11.9, // 盈亏比例4
                'lossrate_1' => 3.2, // 亏损比例1
                'lossrate_2' => 5.3, // 亏损比例2
                'lossrate_3' => 8.6, // 亏损比例34
                'lossrate_4' => 11.9, // 亏损比例4
                'upps' => '',
                'downps' => '',
                'opentime_1' => $opentime,
                'opentime_2' => $opentime,
                'opentime_3' => $opentime,
                'opentime_4' => $opentime,
                'opentime_5' => $opentime,
                'opentime_6' => $opentime,
                'opentime_7' => $opentime,
                'content' => '',
                'iskq' => 1
            ];
        }
        var_dump(Db::table('lc_product')->insertAll($insertAll));
    }
}