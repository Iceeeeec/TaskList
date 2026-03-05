/**
 * 标题: TaskService
 * 说明: 任务服务接口
 * 时间: 2026-03-04 14:46
 * @author: zhoujunyu
 */
package com.shuwu.tasklist.service;

import com.shuwu.tasklist.dto.TaskDetailDTO;
import com.shuwu.tasklist.dto.TaskListDTO;
import com.shuwu.tasklist.entity.TaskInfo;

import java.util.List;

public interface TaskService {

    /** 查询任务列表（含筛选和搜索） */
    List<TaskListDTO> list(Long userId, String filter, String keyword);

    /** 查询任务详情 */
    TaskDetailDTO detail(Long id, Long userId);

    /** 新建任务 */
    TaskInfo add(Long userId, String title, String priority, Long folderId,
            List<Long> tagIds, String dueDate);

    /** 修改任务 */
    void update(TaskInfo task, Long userId);

    /** 切换完成状态 */
    void toggle(Long id, Long userId);

    /** 删除任务 */
    void delete(Long id, Long userId);

    /** 清除已完成任务 */
    void clearCompleted(Long userId);

    /** 更新任务标签 */
    void updateTags(Long taskId, List<Long> tagIds);
}
