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
 * 项目管理
 * Class Item
 * @package app\akszadmin\controller
 */
class Item extends Controller
{
    /**
     * 绑定数据表
     * @var string
     */
    protected $table = 'LcItem';

    /**
     * 项目管理
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
        $this->title = '项目管理';
        $query = $this->_query($this->table)->equal('type,class')->like('title');
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
        $this->mlist = Db::name('LcItemClass')->select();
        $this->tlist = Db::name('LcItemType')->select();
        foreach ($data as &$vo) {
            list($vo['pay_type'], $vo['item_class']) = [[], []];
            foreach ($this->tlist as $type) if ($type['id'] == $vo['type']) $vo['pay_type'] = $type;
            foreach ($this->mlist as $class) if ($class['id'] == $vo['class']) $vo['item_class'] = $class;
            $vo['percent'] = model('akszadmin/item')->getProjectPercent($vo['id']);
        }
    }

    /**
     * 添加项目
     * @auth true
     * @throws \think\Exception
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     * @throws \think\exception\PDOException
     */
    public function add()
    {
        $this->title = '添加项目';
        $this->_form($this->table, 'form');
    }

    /**
     * 编辑项目
     * @auth true
     * @throws \think\Exception
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\ModelNotFoundException
     * @throws \think\exception\DbException
     * @throws \think\exception\PDOException
     */
    public function edit()
    {
        $this->title = '编辑项目';
        $this->_form($this->table, 'form');
    }

    /**
     * 删除项目
     * @auth true
     * @throws \think\Exception
     * @throws \think\exception\PDOException
     */
    public function remove()
    {
        $this->_delete($this->table);
    }

    /**
     * 表单数据处理
     * @param array $vo
     * @throws \ReflectionException
     */
    protected function _form_filter(&$vo){
        if ($this->request->isGet()) {
            $vo['prize'] = isset($vo['prize'])?$vo['prize']:0;
            $vo['integral'] = isset($vo['integral'])?$vo['integral']:0;
            if (empty($vo['class']) && $this->request->get('class', '0')) $vo['class'] = $this->request->get('class', '0');
            if (empty($vo['type']) && $this->request->get('type', '0')) $vo['type'] = $this->request->get('type', '0');
            $this->class = Db::name("LcItemClass")->order('id asc')->select();
            $this->type = Db::name("LcItemType")->order('id asc')->select();
        }
        if ($this->request->isPost()) {
            if($vo['type']==2&&$vo['day']<7) $this->error("每周返息期限需大于等于7天");
            if($vo['type']==3&&$vo['day']<30) $this->error("每月返息期限需大于等于30天");
        }
        if (empty($vo['add_time'])) $vo['add_time'] = date("Y-m-d H:i:s");
    }

}
