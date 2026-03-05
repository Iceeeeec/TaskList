/**
 * 标题: TaskDetailDTO
 * 说明: 任务详情返回 DTO（含子任务、标签、文件夹完整信息）
 * 时间: 2026-03-04 14:46
 * @author: zhoujunyu
 */
package com.shuwu.tasklist.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class TaskDetailDTO {

    private Long id;
    private String title;
    private String description;
    private String priority;
    private LocalDateTime dueDate;
    private Integer completed;
    private Integer reminder;
    private String note;
    private LocalDateTime createTime;

    /** 文件夹信息 */
    private TaskListDTO.FolderInfo folder;

    /** 标签列表 */
    private List<TaskListDTO.TagInfo> tags;

    /** 子任务列表 */
    private List<SubtaskInfo> subtasks;

    @Data
    public static class SubtaskInfo {
        private Long id;
        private String text;
        private Integer done;
    }
}
