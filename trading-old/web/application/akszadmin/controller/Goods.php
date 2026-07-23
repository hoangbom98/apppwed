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
 * 产品管理
 * Class Item
 * @package app\akszadmin\controller
 */
class Goods extends Controller
{
    /**
     * 绑定数据表
     * @var string
     */
    protected $table = 'LcProduct';
    protected $risk_table = 'LcRisk';

    /**
     * 产品列表
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
        $this->title = '产品列表';
        $query = $this->_query($this->table)->like('title');
        $query->order('sort asc,id desc')->page();
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
     * 添加产品
     * @auth true
     * @throws \think\Exception
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     * @throws \think\exception\PDOException
     */
    public function add()
    {
        $this->title = '添加产品';
        $this->_form($this->table, 'form');
    }

    /**
     * 编辑产品
     * @auth true
     * @throws \think\Exception
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     * @throws \think\exception\PDOException
     */
    public function edit()
    {
        $this->title = '编辑产品';
        $this->_form($this->table, 'form');
    }
	/**
     * 状态 开启或者关闭
     * @auth true
     * @throws \think\Exception
     * @throws \think\exception\PDOException
     */
    public function iskqopen()
    {
        $this->applyCsrfToken();
        $id = $this->request->param('id');
        $iskq = $this->request->param('iskq');
        $this->_save($this->table, ['iskq' => $iskq]);
    }
    
    public function showps(){
    	$this->applyCsrfToken();
        $id = $this->request->param('id');
        $iskq = $this->request->param('do');
        $this->_save($this->table, ['showps' => $iskq]);
    }
    public function showps2(){
    	$this->applyCsrfToken();
        $id = $this->request->param('id');
        $iskq = $this->request->param('do');
        $this->_save($this->table, ['showps2' => $iskq]);
    }
    /**
     * 状态
     * @auth true
     * @throws \think\Exception
     * @throws \think\exception\PDOException
     */
    public function proisopen()
    {
        $this->applyCsrfToken();
        $id = $this->request->param('id');
        $isopen = $this->request->param('isopen');

        $this->_save($this->table, ['isopen' => $isopen]);
    }
    /**
     * 删除产品
     * @auth true
     * @throws \think\Exception
     * @throws \think\exception\PDOException
     */
    public function remove()
    {
        $this->applyCsrfToken();
        $this->_delete($this->table);
    }

    /**
     * 表单数据处理
     * @param array $vo
     * @throws \ReflectionException
     */
    protected function _form_filter(&$vo){
        if ($this->request->isGet()) {

        }
    }
    /**
     * 风控管理
     * @auth true
     * @menu true
     * @throws \think\Exception
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     * @throws \think\exception\PDOException
     */
    public function risk()
    {
        $this->title = '风控管理';
        $this->_form($this->risk_table, 'risk');
    }

}
