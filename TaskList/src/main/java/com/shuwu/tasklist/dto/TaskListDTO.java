/**
 * 标题: TaskListDTO
 * 说明: 任务列表返回 DTO（含文件夹和标签摘要）
 * 时间: 2026-03-04 14:46
 * @author: zhoujunyu
 */
package com.shuwu.tasklist.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class TaskListDTO {

    private Long id;
    private String title;
    private String description;
    private String priority;
    private LocalDateTime dueDate;
    private Integer completed;

    /** 文件夹信息 */
    private FolderInfo folder;

    /** 标签列表 */
    private List<TagInfo> tags;

    @Data
    public static class FolderInfo {
        private Long id;
        private String name;
        private Integer colorIndex;
    }

    @Data
    public static class TagInfo {
        private Long id;
        private String name;
        private Integer colorIndex;
    }
}
