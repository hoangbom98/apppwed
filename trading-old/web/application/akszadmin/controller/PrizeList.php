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

namespace app\akszadmin\controller;

use library\Controller;
use think\Db;

/**
 * 抽奖记录
 * Class Item
 * @package app\akszadmin\controller
 */
class PrizeList extends Controller
{
    /**
     * 绑定数据表
     * @var string
     */
    protected $table = 'LcPrizeList';

    /**
     * 抽奖记录
     * @auth true
     * @menu true
     * @throws \think\Exception
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     * @throws \think\exception\PDOException
     */
    public function index()
    {
        $this->title = '抽奖记录';
        $query = $this->_query($this->table)->alias('i')->field('i.*,u.phone,u.name as u_name');
        $query->join('lc_user u','i.uid=u.id')->equal('i.type#i_type')->like('u.phone#u_phone,u.name#u_name')->dateBetween('i.time#i_time')->order('i.id desc')->page();
    }

    /**
     * 增减余额
     * @auth true
     * @throws \think\Exception
     * @throws \think\exception\PDOException
     */
    public function add(){
        $this->title = '添加抽奖记录';
        $this->_form($this->table, 'form');
    }
    
    /**
     * 表单数据处理
     * @param array $vo
     * @throws \ReflectionException
     */
    protected function _form_filter(&$vo){
         if($this->request->isPost()){
            if(!$vo['phone']) $this->error("用户账号必填");
            if(!$vo['name']) $this->error("奖品名称必填");
            $uid = Db::name("LcUser")->where(['phone'=>$vo['phone']])->value('id');
            if(!$uid) $this->error("暂无该用户");
            $vo['uid'] = $uid;
            $vo['time'] = date('Y-m-d H:i:s');
         }
    }
    
    /**
     * 删除抽奖记录
     * @auth true
     * @throws \think\Exception
     * @throws \think\exception\PDOException
     */
    public function remove()
    {
        $this->applyCsrfToken();
        $this->_delete($this->table);
    }
}
