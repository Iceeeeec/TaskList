/**
 * 标题: TaskInfo
 * 说明: 任务主表实体类
 * 时间: 2026-03-04 14:46
 * @author: zhoujunyu
 */
package com.shuwu.tasklist.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("task_info")
public class TaskInfo {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 所属用户ID */
    private Long userId;

    /** 所属文件夹ID（可为空） */
    private Long folderId;

    /** 任务标题 */
    private String title;

    /** 任务描述 */
    private String description;

    /** 优先级 high/mid/low */
    private String priority;

    /** 截止日期 */
    private LocalDateTime dueDate;

    /** 是否完成 */
    private Integer completed;

    /** 完成时间 */
    private LocalDateTime completedTime;

    /** 是否提醒 */
    private Integer reminder;

    /** 备注 */
    private String note;

    /** 排序序号 */
    private Integer sortOrder;

    /** 创建时间 */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    /** 更新时间 */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    /** 逻辑删除 */
    @TableLogic
    private Integer delFlag;
}
