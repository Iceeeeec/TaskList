/**
 * 标题: TaskTagRelMapper
 * 说明: 任务-标签关联 Mapper 接口
 * 时间: 2026-03-04 14:46
 * @author: zhoujunyu
 */
package com.shuwu.tasklist.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shuwu.tasklist.entity.TaskTagRel;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface TaskTagRelMapper extends BaseMapper<TaskTagRel> {
}
