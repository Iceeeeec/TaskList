/**
 * 标题: TaskTagRel
 * 说明: 任务-标签关联实体类
 * 时间: 2026-03-04 14:46
 * @author: zhoujunyu
 */
package com.shuwu.tasklist.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

@Data
@TableName("task_tag_rel")
public class TaskTagRel {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 任务ID */
    private Long taskId;

    /** 标签ID */
    private Long tagId;
}
