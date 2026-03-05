/**
 * 标题: TaskFolderMapper
 * 说明: 文件夹 Mapper 接口
 * 时间: 2026-03-04 14:46
 * @author: zhoujunyu
 */
package com.shuwu.tasklist.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shuwu.tasklist.entity.TaskFolder;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface TaskFolderMapper extends BaseMapper<TaskFolder> {
}
