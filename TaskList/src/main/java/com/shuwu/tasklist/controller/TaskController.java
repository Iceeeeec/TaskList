/**
 * 标题: TaskController
 * 说明: 任务接口 - 列表/详情/新建/修改/切换/删除/清除/标签
 * 时间: 2026-03-04 14:46
 * @author: zhoujunyu
 */
package com.shuwu.tasklist.controller;

import com.shuwu.tasklist.common.Result;
import com.shuwu.tasklist.dto.TaskDetailDTO;
import com.shuwu.tasklist.dto.TaskListDTO;
import com.shuwu.tasklist.entity.TaskInfo;
import com.shuwu.tasklist.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/task")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    /**
     * 查询任务列表（支持筛选和搜索）
     */
    @GetMapping("/list")
    public Result<List<TaskListDTO>> list(
            @RequestHeader(value = "userId", defaultValue = "1") Long userId,
            @RequestParam(value = "filter", defaultValue = "all") String filter,
            @RequestParam(value = "keyword", required = false) String keyword) {
        return Result.ok(taskService.list(userId, filter, keyword));
    }

    /**
     * 查询任务详情
     */
    @GetMapping("/detail/{id}")
    public Result<TaskDetailDTO> detail(
            @RequestHeader(value = "userId", defaultValue = "1") Long userId,
            @PathVariable Long id) {
        TaskDetailDTO dto = taskService.detail(id, userId);
        if (dto == null) {
            return Result.fail("任务不存在");
        }
        return Result.ok(dto);
    }

    /**
     * 新建任务
     */
    @PostMapping("/add")
    public Result<?> add(@RequestHeader(value = "userId", defaultValue = "1") Long userId,
            @RequestBody Map<String, Object> params) {
        String title = (String) params.get("title");
        String priority = (String) params.get("priority");
        Long folderId = params.get("folderId") != null ? Long.valueOf(params.get("folderId").toString()) : null;

        List<?> rawTagIds = (List<?>) params.get("tagIds");
        List<Long> tagIds = null;
        if (rawTagIds != null) {
            tagIds = rawTagIds.stream().map(id -> Long.valueOf(id.toString()))
                    .collect(java.util.stream.Collectors.toList());
        }

        String dueDate = (String) params.get("dueDate");

        TaskInfo task = taskService.add(userId, title, priority, folderId, tagIds, dueDate);
        return Result.ok(task);
    }

    /**
     * 修改任务
     */
    @PutMapping("/update")
    public Result<?> update(@RequestHeader(value = "userId", defaultValue = "1") Long userId,
            @RequestBody TaskInfo task) {
        taskService.update(task, userId);
        return Result.ok();
    }

    /**
     * 切换完成状态
     */
    @PutMapping("/toggle/{id}")
    public Result<?> toggle(@RequestHeader(value = "userId", defaultValue = "1") Long userId,
            @PathVariable Long id) {
        taskService.toggle(id, userId);
        return Result.ok();
    }

    /**
     * 删除任务
     */
    @DeleteMapping("/delete/{id}")
    public Result<?> delete(@RequestHeader(value = "userId", defaultValue = "1") Long userId,
            @PathVariable Long id) {
        taskService.delete(id, userId);
        return Result.ok();
    }

    /**
     * 清除所有已完成任务
     */
    @DeleteMapping("/clearCompleted")
    public Result<?> clearCompleted(
            @RequestHeader(value = "userId", defaultValue = "1") Long userId) {
        taskService.clearCompleted(userId);
        return Result.ok();
    }

    /**
     * 更新任务标签
     */
    @PutMapping("/tags")
    public Result<?> updateTags(@RequestBody Map<String, Object> params) {
        Long taskId = Long.valueOf(params.get("taskId").toString());
        List<?> rawTagIds = (List<?>) params.get("tagIds");
        List<Long> tagIds = null;
        if (rawTagIds != null) {
            tagIds = rawTagIds.stream().map(id -> Long.valueOf(id.toString()))
                    .collect(java.util.stream.Collectors.toList());
        }
        taskService.updateTags(taskId, tagIds);
        return Result.ok();
    }
}
