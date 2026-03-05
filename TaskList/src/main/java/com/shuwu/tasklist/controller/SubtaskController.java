/**
 * 标题: SubtaskController
 * 说明: 子任务接口 - 添加/切换/删除
 * 时间: 2026-03-04 14:46
 * @author: zhoujunyu
 */
package com.shuwu.tasklist.controller;

import com.shuwu.tasklist.common.Result;
import com.shuwu.tasklist.service.SubtaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/subtask")
@RequiredArgsConstructor
public class SubtaskController {

    private final SubtaskService subtaskService;

    /**
     * 添加子任务
     */
    @PostMapping("/add")
    public Result<?> add(@RequestBody Map<String, Object> params) {
        Long taskId = Long.valueOf(params.get("taskId").toString());
        String text = (String) params.get("text");
        subtaskService.add(taskId, text);
        return Result.ok();
    }

    /**
     * 切换子任务完成状态
     */
    @PutMapping("/toggle/{id}")
    public Result<?> toggle(@PathVariable Long id) {
        subtaskService.toggle(id);
        return Result.ok();
    }

    /**
     * 删除子任务
     */
    @DeleteMapping("/delete/{id}")
    public Result<?> delete(@PathVariable Long id) {
        subtaskService.delete(id);
        return Result.ok();
    }
}
