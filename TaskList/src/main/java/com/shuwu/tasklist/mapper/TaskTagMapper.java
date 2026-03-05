/**
 * 标题: TaskTagMapper
 * 说明: 标签 Mapper 接口
 * 时间: 2026-03-04 14:46
 * @author: zhoujunyu
 */
package com.shuwu.tasklist.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shuwu.tasklist.entity.TaskTag;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface TaskTagMapper extends BaseMapper<TaskTag> {
}
