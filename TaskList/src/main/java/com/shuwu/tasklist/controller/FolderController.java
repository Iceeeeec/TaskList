/**
 * 标题: FolderController
 * 说明: 文件夹接口 - 列表/新建/修改/删除
 * 时间: 2026-03-04 14:46
 * @author: zhoujunyu
 */
package com.shuwu.tasklist.controller;

import com.shuwu.tasklist.common.Result;
import com.shuwu.tasklist.entity.TaskFolder;
import com.shuwu.tasklist.service.FolderService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/folder")
@RequiredArgsConstructor
public class FolderController {

    private final FolderService folderService;

    /**
     * 查询文件夹列表
     */
    @GetMapping("/list")
    public Result<List<TaskFolder>> list(
            @RequestHeader(value = "userId", defaultValue = "1") Long userId) {
        return Result.ok(folderService.listByUserId(userId));
    }

    /**
     * 新建文件夹
     */
    @PostMapping("/add")
    public Result<?> add(@RequestHeader(value = "userId", defaultValue = "1") Long userId,
            @RequestBody Map<String, Object> params) {
        String name = (String) params.get("name");
        Integer colorIndex = (Integer) params.get("colorIndex");
        folderService.add(userId, name, colorIndex);
        return Result.ok();
    }

    /**
     * 修改文件夹
     */
    @PutMapping("/update")
    public Result<?> update(@RequestHeader(value = "userId", defaultValue = "1") Long userId,
            @RequestBody Map<String, Object> params) {
        Long id = Long.valueOf(params.get("id").toString());
        String name = (String) params.get("name");
        Integer colorIndex = (Integer) params.get("colorIndex");
        folderService.update(id, userId, name, colorIndex);
        return Result.ok();
    }

    /**
     * 删除文件夹
     */
    @DeleteMapping("/delete/{id}")
    public Result<?> delete(@RequestHeader(value = "userId", defaultValue = "1") Long userId,
            @PathVariable Long id) {
        folderService.delete(id, userId);
        return Result.ok();
    }
}
