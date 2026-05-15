package com.tiendasgo.catalog.services.impl;

import com.tiendasgo.catalog.domain.entity.Producto;
import com.tiendasgo.catalog.domain.entity.Marca;
import com.tiendasgo.catalog.domain.entity.SubCategoria;
import com.tiendasgo.catalog.domain.repository.ProductoRepository;
import com.tiendasgo.catalog.domain.repository.MarcaRepository;
import com.tiendasgo.catalog.domain.repository.SubCategoriaRepository;
import com.tiendasgo.catalog.dto.request.ProductoRequest;
import com.tiendasgo.catalog.dto.response.ProductoResponse;
import com.tiendasgo.catalog.exceptions.DuplicateResourceException;
import com.tiendasgo.catalog.exceptions.InvalidPriceException;
import com.tiendasgo.catalog.exceptions.ResourceNotFoundException;
import com.tiendasgo.catalog.services.IProductoService;
import com.tiendasgo.catalog.utils.ProductoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductoServiceImpl implements IProductoService {
    private final ProductoRepository productoRepository;
    private final MarcaRepository marcaRepository;
    private final SubCategoriaRepository subCategoriaRepository;
    private final ProductoMapper productoMapper;

    @Override
    public List<ProductoResponse> listarTodos() {
        return productoRepository.findAll().stream()
                .map(productoMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ProductoResponse obtenerPorId(Integer id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con ID: " + id));
        return productoMapper.toResponse(producto);
    }

    @Override
    @Transactional
    public ProductoResponse actualizar(Integer id, ProductoRequest req) {
        // 1. Verificar existencia
        Producto existing = productoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con ID: " + id));

        // 2. Validar precios
        if (req.getPrecioVenta().compareTo(req.getPrecioCosto()) <= 0) {
            throw new InvalidPriceException("El precio de venta debe ser mayor al precio de costo.");
        }

        // 3. Validar SKU (solo si cambió y no existe en otro producto)
        if (!existing.getSku().equalsIgnoreCase(req.getSku()) &&
                productoRepository.existsBySku(req.getSku())) {
            throw new DuplicateResourceException("El SKU " + req.getSku() + " ya está en uso por otro producto.");
        }

        // 4. Actualizar campos de texto y valores
        existing.setNombreBase(req.getNombreBase());
        existing.setVariante(req.getVariante());
        existing.setMedidaValor(req.getMedidaValor());
        existing.setMedidaUnidad(req.getMedidaUnidad());
        existing.setSku(req.getSku());
        existing.setPrecioCosto(req.getPrecioCosto());
        existing.setPrecioVenta(req.getPrecioVenta());
        existing.setImagenUrl(req.getImagenUrl());
        existing.setEstado(req.getEstado());

        // 5. Actualizar Relaciones
        // Nota: Debes inyectar MarcaRepository y SubCategoriaRepository
        if (!existing.getMarca().getId().equals(req.getIdMarca())) {
            Marca nuevaMarca = marcaRepository.findById(req.getIdMarca())
                    .orElseThrow(() -> new ResourceNotFoundException("Marca no encontrada"));
            existing.setMarca(nuevaMarca);
        }

        if (!existing.getSubCategoria().getId().equals(req.getIdSubCategoria())) {
            SubCategoria nuevaSub = subCategoriaRepository.findById(req.getIdSubCategoria())
                    .orElseThrow(() -> new ResourceNotFoundException("Subcategoría no encontrada"));
            existing.setSubCategoria(nuevaSub);
        }

        return productoMapper.toResponse(productoRepository.save(existing));
    }

    @Override
    @Transactional
    public ProductoResponse crear(ProductoRequest req) {
        if (req.getPrecioVenta().compareTo(req.getPrecioCosto()) <= 0) {
            throw new InvalidPriceException("El precio de venta debe ser mayor al precio de costo.");
        }
        Marca marca = marcaRepository.findById(req.getIdMarca())
                .orElseThrow(() -> new ResourceNotFoundException("Marca no encontrada: " + req.getIdMarca()));
        SubCategoria subCategoria = subCategoriaRepository.findById(req.getIdSubCategoria())
                .orElseThrow(() -> new ResourceNotFoundException("Subcategoría no encontrada: " + req.getIdSubCategoria()));

        // Generar secuencial para SKU
        Integer maxId = productoRepository.findMaxIdByMarcaAndSubCategoria(marca.getId(), subCategoria.getId());
        int secuencial = (maxId != null ? maxId : 0) + 1;
        String secuencialStr = String.format("%04d", secuencial);
        String sku = subCategoria.getPrefijo() + "-" + marca.getCodigoMarca() + "-" + secuencialStr;

        if (productoRepository.existsBySku(sku)) {
            throw new DuplicateResourceException("Ya existe un producto con ese SKU: " + sku);
        }

        Producto producto = productoMapper.toEntity(req, marca, subCategoria);
        producto.setSku(sku);
        Producto saved = productoRepository.save(producto);
        return productoMapper.toResponse(saved);
    }
    @Override
    @Transactional
    public void cambiarEstado(Integer id, Boolean nuevoEstado) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con ID: " + id));
        producto.setEstado(nuevoEstado);
        productoRepository.save(producto);
    }



}
