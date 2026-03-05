/**
 * 标题: TagController
 * 说明: 标签接口 - 列表/新建/删除
 * 时间: 2026-03-04 14:46
 * @author: zhoujunyu
 */
package com.shuwu.tasklist.controller;

import com.shuwu.tasklist.common.Result;
import com.shuwu.tasklist.entity.TaskTag;
import com.shuwu.tasklist.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tag")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    /**
     * 查询标签列表
     */
    @GetMapping("/list")
    public Result<List<TaskTag>> list(
            @RequestHeader(value = "userId", defaultValue = "1") Long userId) {
        return Result.ok(tagService.listByUserId(userId));
    }

    /**
     * 新建标签
     */
    @PostMapping("/add")
    public Result<?> add(@RequestHeader(value = "userId", defaultValue = "1") Long userId,
            @RequestBody Map<String, Object> params) {
        String name = (String) params.get("name");
        Integer colorIndex = (Integer) params.get("colorIndex");
        tagService.add(userId, name, colorIndex);
        return Result.ok();
    }

    /**
     * 删除标签
     */
    @DeleteMapping("/delete/{id}")
    public Result<?> delete(@RequestHeader(value = "userId", defaultValue = "1") Long userId,
            @PathVariable Long id) {
        tagService.delete(id, userId);
        return Result.ok();
    }
}
