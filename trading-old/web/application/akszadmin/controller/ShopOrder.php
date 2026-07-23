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
 * 兑换管理
 * Class Item
 * @package app\akszadmin\controller
 */
class ShopOrder extends Controller
{
    /**
     * 绑定数据表
     * @var string
     */
    protected $table = 'LcShopOrder';

    /**
     * 兑换列表
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
        $this->title = '兑换列表';
        $query = $this->_query($this->table)->alias('i')->field('i.*,u.phone,u.name as u_name');
        $query->join('lc_user u','i.uid=u.id')->equal('i.type#i_type')->like('u.phone#u_phone,u.name#u_name')->dateBetween('i.time#i_time')->order('i.id desc')->page();
    }

    /**
     * 删除兑换
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
