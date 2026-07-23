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
 * 银行卡管理
 * Class Item
 * @package app\akszadmin\controller
 */
class Bank extends Controller
{
    /**
     * 绑定数据表
     * @var string
     */
    protected $table = 'LcBank';

    /**
     * 银行卡列表
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
        $this->title = '银行卡列表';
        $query = $this->_query($this->table)->alias('i')->field('i.*,u.phone,u.name as u_name');
        $query->join('lc_user u','i.uid=u.id')->like('i.account#i_account,u.phone#u_phone,u.name#u_name')->order('i.id desc')->page();
    }

    /**
     * 数据列表处理
     * @param array $data
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     */
    protected function _index_page_filter(&$data)
    {

    }
    
    /**
     * 编辑银行卡
     * @auth true
     * @throws \think\Exception
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     * @throws \think\exception\PDOException
     */
    public function edit()
    {
        $this->title = '编辑银行卡';
        $this->_form($this->table, 'form');
    }
    
    /**
     * 表单数据处理
     * @param array $vo
     * @throws \ReflectionException
     */
    protected function _form_filter(&$vo){
        if($this->request->isGet()){
            $vo['phone'] = Db::name("LcUser")->where(['id'=>$vo['uid']])->value('phone');
        }
    }

    /**
     * 删除银行卡
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
